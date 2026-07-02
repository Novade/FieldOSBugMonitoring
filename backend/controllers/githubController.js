const axios = require('axios');
const config = require('../config/env');
const githubConfig = require('../config/github');

// --- GraphQL client ---
// GitHub's GraphQL API is the bulk-query equivalent of Jira's JQL search:
// one query returns PRs WITH their reviews and changed files embedded, so we
// avoid the REST N+1 pattern (1 list call + 2 calls per PR) that made the
// dashboard slow. https://api.github.com/graphql — POST, bearer token.
const ghGraphQL = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: { Authorization: `Bearer ${config.github.token}` },
});

const MAX_TRANSIENT_RETRIES = 3;

ghGraphQL.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const isRateLimited =
      status === 429 ||
      (status === 403 && err.response?.headers?.['x-ratelimit-remaining'] === '0') ||
      (status === 403 && err.response?.headers?.['retry-after']);
    if (isRateLimited) {
      const retryCount = (err.config.__rateLimitRetryCount || 0) + 1;
      if (retryCount > MAX_TRANSIENT_RETRIES) {
        const e = new Error('GitHub rate limit exceeded. Please try again later.');
        e.isGitHubError = true;
        e.status = 429;
        return Promise.reject(e);
      }
      err.config.__rateLimitRetryCount = retryCount;
      const retryAfter = parseInt(err.response.headers['retry-after'] || '60', 10);
      console.warn(`[github] rate limited — waiting ${retryAfter}s before retry (${retryCount}/${MAX_TRANSIENT_RETRIES})`);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      return ghGraphQL(err.config);
    }
    // 502/503/504 are transient gateway/timeout errors — GitHub's own
    // servers hiccupping under load, not something wrong with our request.
    // Retrying with backoff usually succeeds on the next attempt.
    if ([502, 503, 504].includes(err.response?.status)) {
      const retryCount = (err.config.__retryCount || 0) + 1;
      if (retryCount <= MAX_TRANSIENT_RETRIES) {
        const delayMs = 1000 * 2 ** (retryCount - 1); // 1s, 2s, 4s
        console.warn(
          `[github] transient ${err.response.status} error — retry ${retryCount}/${MAX_TRANSIENT_RETRIES} in ${delayMs}ms`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        err.config.__retryCount = retryCount;
        return ghGraphQL(err.config);
      }
    }
    if (err.response) {
      const e = new Error(err.response.data?.message || err.message);
      e.isGitHubError = true;
      e.status = err.response.status;
      return Promise.reject(e);
    }
    const e = new Error('Cannot reach GitHub API. Check your network connection.');
    e.isGitHubError = true;
    e.status = 503;
    return Promise.reject(e);
  }
);

// Runs a GraphQL query and returns the `data` object, throwing on GraphQL errors
// (which arrive in the body with an HTTP 200).
async function gqlQuery(query, variables) {
  const res = await ghGraphQL.post('', { query, variables });
  if (res.data.errors?.length) {
    const msg = res.data.errors.map((e) => e.message).join('; ');
    const e = new Error(`GitHub GraphQL error: ${msg}`);
    e.isGitHubError = true;
    e.status = 502;
    throw e;
  }
  return res.data.data;
}

// --- Caches ---
let prDataCache = null, prDataCacheTs = 0;
let prDataFetching = null;
let trendDataCache = null, trendDataCacheTs = 0;
let trendDataFetching = null;
let summaryCache = null, summaryCacheTs = 0;
let reposCache = null, reposCacheTs = 0;
let openPrsCache = null, openPrsCacheTs = 0;

// In-memory fetch-progress tracker — lets the frontend show real per-repo
// status ("fetching NovadeLite…") during a cold-cache load instead of a
// generic spinner. Pure bookkeeping: no GitHub calls, no added latency.
let fetchProgress = { active: false, repos: {} };

function startProgress(repos) {
  fetchProgress = { active: true, repos: Object.fromEntries(repos.map((r) => [r, 'pending'])) };
}
function setProgress(repo, status) {
  if (fetchProgress.repos[repo] !== undefined) fetchProgress.repos[repo] = status;
}
function endProgress() {
  fetchProgress = { ...fetchProgress, active: false };
}

const HIST_TTL = githubConfig.cacheTtl.historical;
const OPEN_TTL = githubConfig.cacheTtl.openPrs;

// --- Math helpers ---
// Linear interpolation method — matches Excel PERCENTILE.INC and
// industry tools (LinearB, Swarmia, DORA).
function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  if (sorted.length === 1) return parseFloat(sorted[0].toFixed(2));
  const pos = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const result = sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
  return parseFloat(result.toFixed(2));
}

// --- Concurrency limiter ---
async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let index = 0;
  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// Shared cursor-pagination loop for GraphQL connections. `getConnection`
// pulls the { pageInfo, nodes } connection out of each page's response body.
// `processNodes(nodes, out)` pushes results into `out` and returns true to
// stop paginating early (e.g. a date boundary was crossed) — otherwise
// pagination continues naturally until hasNextPage is false or maxPages hits.
async function paginateGraphQL(query, variables, getConnection, processNodes, { maxPages, initialCursor = null }) {
  const out = [];
  let cursor = initialCursor;
  for (let page = 0; page < maxPages; page++) {
    const data = await gqlQuery(query, { ...variables, cursor });
    const conn = getConnection(data);
    if (!conn) break;
    const hitBoundary = processNodes(conn.nodes, out);
    if (hitBoundary || !conn.pageInfo.hasNextPage) break;
    cursor = conn.pageInfo.endCursor;
  }
  return out;
}

// --- Metric helpers (operate on normalized GraphQL records) ---
function computeCycleTimeHours(createdAt, mergedAt) {
  return (new Date(mergedAt) - new Date(createdAt)) / 3_600_000;
}

// reviews: array of { state, submittedAt, isBot }
function computeFirstReviewHours(createdAt, reviews) {
  const human = reviews.filter(
    (r) => !r.isBot && ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'].includes(r.state)
  );
  if (!human.length) return null;
  const firstTs = human.reduce(
    (min, r) => (r.submittedAt < min ? r.submittedAt : min),
    human[0].submittedAt
  );
  return (new Date(firstTs) - new Date(createdAt)) / 3_600_000;
}

function isExcludedFile(path) {
  return githubConfig.excludedFilePatterns.some((p) => p.test(path));
}

// files: array of { path, additions, deletions }
function computePRSize(files) {
  return files
    .filter((f) => !isExcludedFile(f.path))
    .reduce(
      (acc, f) => ({
        lines: acc.lines + f.additions + f.deletions,
        additions: acc.additions + f.additions,
        deletions: acc.deletions + f.deletions,
      }),
      { lines: 0, additions: 0, deletions: 0 }
    );
}

function getPhase(reviews, reviewDecision) {
  const humanReviews = reviews.filter((r) => !r.isBot);
  if (humanReviews.length === 0) return 'Waiting 1st review';
  if (reviewDecision === 'APPROVED') return 'Approved';
  if (reviewDecision === 'CHANGES_REQUESTED') return 'Changes requested';
  return 'Review in progress';
}

// Flattens a GraphQL PR node into a plain shape the rest of the code uses.
function normalizePRNode(node, repo) {
  return {
    repo,
    number: node.number,
    title: node.title,
    url: node.url,
    author: node.author?.login || 'unknown',
    createdAt: node.createdAt,
    mergedAt: node.mergedAt,
    isDraft: node.isDraft || false,
    reviewDecision: node.reviewDecision || null,
    reviews: (node.reviews?.nodes || []).map((r) => ({
      state: r.state,
      submittedAt: r.submittedAt,
      isBot: r.author?.__typename === 'Bot',
    })),
    files: (node.files?.nodes || []).map((f) => ({
      path: f.path,
      additions: f.additions,
      deletions: f.deletions,
    })),
    filesHasNextPage: node.files?.pageInfo?.hasNextPage || false,
    filesEndCursor: node.files?.pageInfo?.endCursor || null,
  };
}

// --- GraphQL queries ---
const PR_FIELDS = `
  number title url createdAt mergedAt isDraft
  author { login }
  reviewDecision
  reviews(first: 20) {
    nodes { state submittedAt author { login __typename } }
  }
  files(first: 100) {
    pageInfo { hasNextPage endCursor }
    nodes { path additions deletions }
  }
`;

const MERGED_PRS_QUERY = `
  query($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: MERGED, first: 100, after: $cursor,
                   orderBy: { field: CREATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes { ${PR_FIELDS} }
      }
    }
  }
`;

const OPEN_PRS_QUERY = `
  query($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: OPEN, first: 25, after: $cursor,
                   orderBy: { field: CREATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes { ${PR_FIELDS} }
      }
    }
  }
`;

// Lightweight query for the weekly trend — only timestamps (no reviews/files),
// so the larger 8-week window stays cheap and fast.
const TREND_PRS_QUERY = `
  query($owner: String!, $name: String!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: MERGED, first: 100, after: $cursor,
                   orderBy: { field: CREATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes { number createdAt mergedAt }
      }
    }
  }
`;

// Fetches remaining changed files for a single PR that exceeded the 100-file
// page cap. Rare — only outlier PRs pay this extra query.
const PR_REMAINING_FILES_QUERY = `
  query($owner: String!, $name: String!, $number: Int!, $cursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        files(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes { path additions deletions }
        }
      }
    }
  }
`;

async function fetchRemainingFiles(owner, repo, number, cursor) {
  return paginateGraphQL(
    PR_REMAINING_FILES_QUERY,
    { owner, name: repo, number },
    (data) => data.repository?.pullRequest?.files,
    (nodes, out) => {
      out.push(...nodes.map((f) => ({ path: f.path, additions: f.additions, deletions: f.deletions })));
      return false;
    },
    { maxPages: 10, initialCursor: cursor } // backstop ~1000 files
  );
}

// For any PR whose files connection was truncated at 100, fetch the rest so
// PR size isn't undercounted on unusually large PRs.
async function fillTruncatedFiles(records) {
  const truncated = records.filter((r) => r.filesHasNextPage);
  if (!truncated.length) return records;

  console.log(`[github] ${truncated.length} PR(s) exceeded 100 files — fetching remaining pages`);
  await runWithConcurrency(
    truncated.map((rec) => async () => {
      try {
        const extra = await fetchRemainingFiles(config.github.org, rec.repo, rec.number, rec.filesEndCursor);
        rec.files.push(...extra);
      } catch (err) {
        console.warn(`[github] ${rec.repo}#${rec.number} remaining-files fetch failed: ${err.message}`);
      }
    }),
    5
  );
  return records;
}

// --- Data fetching ---
// Fetches all MERGED PRs for a repo created within the buffered window, with
// reviews + files embedded. Paginates by createdAt (desc) and stops once PRs
// fall before the buffer boundary.
async function fetchRepoMergedPRs(owner, repo, since) {
  // PRs created up to 14d before `since` could still have merged inside the window
  const createdSince = new Date(since.getTime() - 14 * 24 * 60 * 60 * 1000);
  return paginateGraphQL(
    MERGED_PRS_QUERY,
    { owner, name: repo },
    (data) => data.repository?.pullRequests,
    (nodes, out) => {
      for (const node of nodes) {
        if (new Date(node.createdAt) < createdSince) return true; // hit boundary
        if (node.mergedAt && new Date(node.mergedAt) >= since) {
          out.push(normalizePRNode(node, repo));
        }
      }
      return false;
    },
    { maxPages: 40 } // safety backstop (~1000 PRs/repo)
  );
}

// Detailed fetch over the 30-day data window (reviews + files). Powers the
// summary KPIs, per-repo charts, and PR-size metric.
async function getSharedPRData() {
  const now = Date.now();
  if (prDataCache && now - prDataCacheTs < HIST_TTL) {
    console.log('[github] PR data cache hit');
    return prDataCache;
  }
  if (prDataFetching) {
    console.log('[github] PR data fetch in progress, waiting…');
    return prDataFetching;
  }

  prDataFetching = (async () => {
    try {
      const repos = githubConfig.repos;
      startProgress(repos);
      const since = new Date(Date.now() - githubConfig.dataWindowDays * 24 * 60 * 60 * 1000);
      const results = await runWithConcurrency(
        repos.map((repo) => () => {
          setProgress(repo, 'fetching');
          return fetchRepoMergedPRs(config.github.org, repo, since)
            .then((prs) => {
              console.log(`[github] ${repo}: ${prs.length} merged PRs in window`);
              setProgress(repo, 'done');
              return prs;
            })
            .catch((err) => {
              console.warn(`[github] ${repo} data fetch failed: ${err.message}`);
              setProgress(repo, 'failed');
              return [];
            });
        }),
        7
      );
      endProgress();

      const records = await fillTruncatedFiles(results.flat());

      // Attach computed metrics to each record
      const enriched = records.map((rec) => {
        const size = computePRSize(rec.files);
        return {
          ...rec,
          cycleTimeHours: computeCycleTimeHours(rec.createdAt, rec.mergedAt),
          firstReviewHours: computeFirstReviewHours(rec.createdAt, rec.reviews),
          sizeLines: size.lines,
        };
      });

      prDataCache = enriched;
      prDataCacheTs = Date.now();
      return prDataCache;
    } finally {
      prDataFetching = null;
    }
  })();

  return prDataFetching;
}

// Lightweight fetch over the 8-week trend window — just timestamps, no reviews
// or files, so it stays fast even though the window is larger.
async function fetchRepoTrendPRs(owner, repo, since) {
  return paginateGraphQL(
    TREND_PRS_QUERY,
    { owner, name: repo },
    (data) => data.repository?.pullRequests,
    (nodes, out) => {
      for (const node of nodes) {
        if (new Date(node.createdAt) < since) return true; // hit boundary
        if (node.mergedAt && new Date(node.mergedAt) >= since) {
          out.push({ createdAt: node.createdAt, mergedAt: node.mergedAt });
        }
      }
      return false;
    },
    { maxPages: 40 }
  );
}

async function getTrendData() {
  const now = Date.now();
  if (trendDataCache && now - trendDataCacheTs < HIST_TTL) {
    console.log('[github] trend data cache hit');
    return trendDataCache;
  }
  if (trendDataFetching) return trendDataFetching;

  trendDataFetching = (async () => {
    try {
      const repos = githubConfig.repos;
      const since = new Date(Date.now() - githubConfig.trendWeeks * 7 * 24 * 60 * 60 * 1000);
      const results = await runWithConcurrency(
        repos.map((repo) => () =>
          fetchRepoTrendPRs(config.github.org, repo, since).catch((err) => {
            console.warn(`[github] ${repo} trend fetch failed: ${err.message}`);
            return [];
          })
        ),
        7
      );
      trendDataCache = results.flat();
      trendDataCacheTs = Date.now();
      return trendDataCache;
    } finally {
      trendDataFetching = null;
    }
  })();

  return trendDataFetching;
}

function buildWeeklyTrend(prs, numWeeks) {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const weeks = [];

  for (let w = numWeeks - 1; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (dayOfWeek - 1) - w * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekPRs = prs.filter((pr) => {
      const mergedAt = new Date(pr.mergedAt);
      return mergedAt >= weekStart && mergedAt < weekEnd;
    });

    const cycleTimes = weekPRs.map((pr) => computeCycleTimeHours(pr.createdAt, pr.mergedAt));
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    weeks.push({
      label,
      cycletime_p75: cycleTimes.length ? percentile(cycleTimes, 75) : null,
      pr_count: weekPRs.length,
    });
  }

  return weeks;
}

// --- Route handlers ---
async function getSummary(req, res, next) {
  try {
    const now = Date.now();
    if (summaryCache && now - summaryCacheTs < HIST_TTL) {
      console.log('[github] summary cache hit');
      return res.json(summaryCache);
    }

    const [prData, trendPRs] = await Promise.all([getSharedPRData(), getTrendData()]);

    const cycleTimes = prData.map((d) => d.cycleTimeHours);
    const firstReviews = prData.filter((d) => d.firstReviewHours !== null).map((d) => d.firstReviewHours);
    const sizes = prData.map((d) => d.sizeLines);

    const weeklyTrend = buildWeeklyTrend(trendPRs, githubConfig.trendWeeks);
    const cycleTimeP75 = percentile(cycleTimes, 75);
    const firstReviewP75 = percentile(firstReviews, 75);

    const result = {
      cycleTime: { p75: cycleTimeP75 },
      firstReview: { p75: firstReviewP75 },
      prSize: { p75: percentile(sizes, 75) },
      weeklyTrend,
      prCount: prData.length,
      fetchedAt: new Date().toISOString(),
    };

    summaryCache = result;
    summaryCacheTs = now;

    console.log(
      `[github] summary computed — ${prData.length} PRs, cycleTime P75=${cycleTimeP75}h, firstReview P75=${firstReviewP75}h`
    );
    res.json(result);
  } catch (err) {
    console.error(`[github] getSummary failed: ${err.message}`);
    next(err);
  }
}

async function getRepos(req, res, next) {
  try {
    const now = Date.now();
    if (reposCache && now - reposCacheTs < HIST_TTL) {
      console.log('[github] repos cache hit');
      return res.json(reposCache);
    }

    const prData = await getSharedPRData();

    const byRepo = {};
    prData.forEach((d) => {
      if (!byRepo[d.repo]) byRepo[d.repo] = [];
      byRepo[d.repo].push(d);
    });

    const repos = Object.entries(byRepo).map(([repo, items]) => {
      const cycleTimes = items.map((d) => d.cycleTimeHours);
      const firstReviews = items
        .filter((d) => d.firstReviewHours !== null)
        .map((d) => d.firstReviewHours);
      const sizes = items.map((d) => d.sizeLines);

      return {
        repo,
        cycleTime_p75: percentile(cycleTimes, 75),
        firstReview_p75: percentile(firstReviews, 75),
        prSize_p75: percentile(sizes, 75),
        pr_count: items.length,
      };
    });

    const result = { repos, fetchedAt: new Date().toISOString() };
    reposCache = result;
    reposCacheTs = now;

    console.log(`[github] repos data computed — ${repos.length} repos`);
    res.json(result);
  } catch (err) {
    console.error(`[github] getRepos failed: ${err.message}`);
    next(err);
  }
}

async function fetchRepoOpenPRs(owner, repo) {
  return paginateGraphQL(
    OPEN_PRS_QUERY,
    { owner, name: repo },
    (data) => data.repository?.pullRequests,
    (nodes, out) => {
      for (const node of nodes) out.push(normalizePRNode(node, repo));
      return false; // no boundary — fetch every open PR until hasNextPage is false
    },
    { maxPages: 20 }
  );
}

async function getOpenPRs(req, res, next) {
  try {
    const now = Date.now();
    if (openPrsCache && now - openPrsCacheTs < OPEN_TTL) {
      console.log('[github] open-prs cache hit');
      return res.json(openPrsCache);
    }

    const repos = githubConfig.repos;
    const repoResults = await runWithConcurrency(
      repos.map((repo) => () =>
        fetchRepoOpenPRs(config.github.org, repo).catch((err) => {
          console.warn(`[github] ${repo} open PRs fetch failed: ${err.message}`);
          return [];
        })
      ),
      7
    );

    // Drafts aren't actually awaiting review yet — exclude them entirely
    const nonDraftRecords = (await fillTruncatedFiles(repoResults.flat())).filter(
      (rec) => !rec.isDraft
    );

    const allOpenPRs = nonDraftRecords.map((rec) => {
      const elapsedHours = (now - new Date(rec.createdAt)) / 3_600_000;
      const size = computePRSize(rec.files);
      const phase = getPhase(rec.reviews, rec.reviewDecision);
      const status =
        elapsedHours > githubConfig.thresholds.cycleTime.breaching
          ? 'Breached'
          : elapsedHours > githubConfig.thresholds.cycleTime.close
          ? 'At Risk'
          : 'On Track';

      return {
        repo: rec.repo,
        number: rec.number,
        title: rec.title,
        author: rec.author,
        url: rec.url,
        elapsedHours: parseFloat(elapsedHours.toFixed(1)),
        sizeLines: size.lines,
        additions: size.additions,
        deletions: size.deletions,
        phase,
        status,
        createdAt: rec.createdAt,
      };
    });

    allOpenPRs.sort((a, b) => b.elapsedHours - a.elapsedHours);

    const result = { openPRs: allOpenPRs, fetchedAt: new Date().toISOString() };
    openPrsCache = result;
    openPrsCacheTs = now;

    console.log(`[github] open-prs fetched — ${allOpenPRs.length} open across all repos`);
    res.json(result);
  } catch (err) {
    console.error(`[github] getOpenPRs failed: ${err.message}`);
    next(err);
  }
}

function getProgress(req, res) {
  res.json(fetchProgress);
}

module.exports = { getSummary, getRepos, getOpenPRs, getProgress };

// Warm the cache on startup so the first page load is instant
(async () => {
  try {
    await Promise.all([getSharedPRData(), getTrendData()]);
    console.log('[github] startup cache warm complete');
  } catch (err) {
    console.warn('[github] startup cache warmup failed:', err.message);
  }
})();
