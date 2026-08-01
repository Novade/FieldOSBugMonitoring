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
  // Without this, a connection that silently stalls (no error, no data) never
  // throws — so the retry interceptor below never gets a chance to run and
  // the request just hangs until something upstream gives up.
  timeout: 20_000,
});

const MAX_TRANSIENT_RETRIES = 3;
// A repo like NovadeLite needs dozens of sequential paginated calls to fetch
// all its PRs. Each page already gets MAX_TRANSIENT_RETRIES of its own, but
// over enough pages the odds of one page exhausting its retries (and taking
// every already-fetched page down with it — pagination throws away partial
// results on error) add up. Retrying the whole repo fetch after that makes
// that already-rare case rarer still, instead of silently returning zero PRs.
const REPO_FETCH_RETRIES = 2;

async function withRepoRetry(repo, fn) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= REPO_FETCH_RETRIES) throw err;
      const delayMs = 2000 * (attempt + 1);
      console.warn(
        `[github] ${repo} fetch failed (${
          err.message
        }) — retrying whole repo (${
          attempt + 1
        }/${REPO_FETCH_RETRIES}) in ${delayMs}ms`
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

// Best-effort repo name for retry/error logs — never throws, since this runs
// inside the error handler itself.
function repoNameFromRequest(err) {
  try {
    return JSON.parse(err.config?.data)?.variables?.name || 'unknown repo';
  } catch {
    return 'unknown repo';
  }
}

ghGraphQL.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const isRateLimited =
      status === 429 ||
      (status === 403 &&
        err.response?.headers?.['x-ratelimit-remaining'] === '0') ||
      (status === 403 && err.response?.headers?.['retry-after']);
    if (isRateLimited) {
      const retryCount = (err.config.__rateLimitRetryCount || 0) + 1;
      if (retryCount > MAX_TRANSIENT_RETRIES) {
        const e = new Error(
          'GitHub rate limit exceeded. Please try again later.'
        );
        e.isGitHubError = true;
        e.status = 429;
        return Promise.reject(e);
      }
      err.config.__rateLimitRetryCount = retryCount;
      const retryAfter = parseInt(
        err.response.headers['retry-after'] || '60',
        10
      );
      console.warn(
        `[github] rate limited — waiting ${retryAfter}s before retry (${retryCount}/${MAX_TRANSIENT_RETRIES})`
      );
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
          `[github] transient ${
            err.response.status
          } error on ${repoNameFromRequest(
            err
          )} — retry ${retryCount}/${MAX_TRANSIENT_RETRIES} in ${delayMs}ms`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        err.config.__retryCount = retryCount;
        return ghGraphQL(err.config);
      }
    }
    // Connection-level drops (aborted requests, resets, timeouts, DNS blips)
    // never reach a response at all — GitHub or an intermediate proxy dropped
    // the connection outright. Just as transient as a 502/503/504, so retry
    // them the same way instead of giving up after a single hiccup. Note:
    // deliberately NOT requiring `err.request` to be truthy here — some abort
    // shapes (e.g. a bare "aborted" error) don't populate it, and any error
    // with no response at all is still worth a retry regardless.
    if (!err.response) {
      const retryCount = (err.config.__networkRetryCount || 0) + 1;
      if (retryCount <= MAX_TRANSIENT_RETRIES) {
        const delayMs = 1000 * 2 ** (retryCount - 1); // 1s, 2s, 4s
        console.warn(
          `[github] network error (${err.message}) on ${repoNameFromRequest(
            err
          )} — retry ${retryCount}/${MAX_TRANSIENT_RETRIES} in ${delayMs}ms`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        err.config.__networkRetryCount = retryCount;
        return ghGraphQL(err.config);
      }
    }
    if (err.response) {
      const e = new Error(err.response.data?.message || err.message);
      e.isGitHubError = true;
      e.status = err.response.status;
      return Promise.reject(e);
    }
    const e = new Error(
      'Cannot reach GitHub API. Check your network connection.'
    );
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
let prDataCache = null,
  prDataCacheTs = 0;
let prDataFetching = null;
let summaryCache = null,
  summaryCacheTs = 0;
let reposCache = null,
  reposCacheTs = 0;
let openPrsCache = null,
  openPrsCacheTs = 0;

// In-memory fetch-progress tracker — lets the frontend show real per-repo
// status ("fetching NovadeLite…") during a cold-cache load instead of a
// generic spinner. Pure bookkeeping: no GitHub calls, no added latency.
let fetchProgress = { active: false, repos: {} };

function startProgress(repos) {
  fetchProgress = {
    active: true,
    repos: Object.fromEntries(repos.map((r) => [r, 'pending'])),
  };
}
function setProgress(repo, status) {
  if (fetchProgress.repos[repo] !== undefined)
    fetchProgress.repos[repo] = status;
}
function endProgress() {
  fetchProgress = { ...fetchProgress, active: false };
}

// Tracks whether each repo's most recent fetch succeeded, independently for
// merged-PR data and open-PR data since they run on separate cache cycles.
// A repo counts as failed if either came back false — the frontend surfaces
// this so one repo's hiccup is visible (and retryable) instead of silently
// missing from an otherwise-fine page.
let repoFetchStatus = {};

function markRepoStatus(repo, kind, ok) {
  repoFetchStatus[repo] = { ...repoFetchStatus[repo], [kind]: ok };
}

const HIST_TTL = githubConfig.cacheTtl.historical;
const OPEN_TTL = githubConfig.cacheTtl.openPrs;

// --- Math helpers ---
// Linear interpolation method — matches Excel PERCENTILE.INC and
// industry tools (LinearB, Swarmia, DORA).
function percentile(arr, p) {
  const nums = (arr || []).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
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
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker)
  );
  return results;
}

// Shared cursor-pagination loop for GraphQL connections. `getConnection`
// pulls the { pageInfo, nodes } connection out of each page's response body.
// `processNodes(nodes, out)` pushes results into `out` and returns true to
// stop paginating early (e.g. a date boundary was crossed) — otherwise
// pagination continues naturally until hasNextPage is false or maxPages hits.
async function paginateGraphQL(
  query,
  variables,
  getConnection,
  processNodes,
  { maxPages, initialCursor = null }
) {
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
    (r) =>
      !r.isBot &&
      ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED'].includes(r.state)
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
      out.push(
        ...nodes.map((f) => ({
          path: f.path,
          additions: f.additions,
          deletions: f.deletions,
        }))
      );
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

  console.log(
    `[github] ${truncated.length} PR(s) exceeded 100 files — fetching remaining pages`
  );
  await runWithConcurrency(
    truncated.map((rec) => async () => {
      try {
        const extra = await fetchRemainingFiles(
          config.github.org,
          rec.repo,
          rec.number,
          rec.filesEndCursor
        );
        rec.files.push(...extra);
      } catch (err) {
        console.warn(
          `[github] ${rec.repo}#${rec.number} remaining-files fetch failed: ${err.message}`
        );
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

// Attaches computed metrics (cycle time, first review, size) to normalized
// PR records — shared by the full cold fetch and a single-repo retry.
function enrichPRRecords(records) {
  return records.map((rec) => {
    const size = computePRSize(rec.files);
    return {
      ...rec,
      cycleTimeHours: computeCycleTimeHours(rec.createdAt, rec.mergedAt),
      firstReviewHours: computeFirstReviewHours(rec.createdAt, rec.reviews),
      sizeLines: size.lines,
    };
  });
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
      const since = new Date(
        Date.now() - githubConfig.dataWindowDays * 24 * 60 * 60 * 1000
      );
      const results = await runWithConcurrency(
        repos.map((repo) => () => {
          setProgress(repo, 'fetching');
          return withRepoRetry(repo, () =>
            fetchRepoMergedPRs(config.github.org, repo, since)
          )
            .then((prs) => {
              console.log(
                `[github] ${repo}: ${prs.length} merged PRs in window`
              );
              setProgress(repo, 'done');
              markRepoStatus(repo, 'merged', true);
              return prs;
            })
            .catch((err) => {
              console.warn(
                `[github] ${repo} data fetch failed: ${err.message}`
              );
              setProgress(repo, 'failed');
              markRepoStatus(repo, 'merged', false);
              return [];
            });
        }),
        7
      );
      endProgress();

      const records = await fillTruncatedFiles(results.flat());
      prDataCache = enrichPRRecords(records);
      prDataCacheTs = Date.now();
      return prDataCache;
    } finally {
      prDataFetching = null;
    }
  })();

  return prDataFetching;
}

// Buckets a set of already-enriched PR records into weekly P75s for all three
// metrics. Pure in-memory computation — no GitHub calls.
function bucketWeekly(prData, windowDays) {
  const numWeeks = Math.ceil(windowDays / 7);
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const weeks = [];

  for (let w = numWeeks - 1; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (dayOfWeek - 1) - w * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekPRs = prData.filter((pr) => {
      const mergedAt = new Date(pr.mergedAt);
      return mergedAt >= weekStart && mergedAt < weekEnd;
    });

    const cycleTimes = weekPRs.map((pr) => pr.cycleTimeHours);
    const firstReviews = weekPRs
      .filter((pr) => pr.firstReviewHours !== null)
      .map((pr) => pr.firstReviewHours);
    const sizes = weekPRs.map((pr) => pr.sizeLines);
    const label = weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    weeks.push({
      label,
      cycleTime_p75: cycleTimes.length ? percentile(cycleTimes, 75) : null,
      firstReview_p75: firstReviews.length
        ? percentile(firstReviews, 75)
        : null,
      prSize_p75: sizes.length ? percentile(sizes, 75) : null,
      pr_count: weekPRs.length,
    });
  }

  return weeks;
}

// Weekly trend for "All Repos" plus one per individual repo, so the frontend
// can let a manager switch the trend charts to a single repo and have it
// stay comparable to that repo's By-Repo bar. All computed from data already
// fetched by getSharedPRData — no extra GitHub calls, just more bucketing.
function buildWeeklyTrend(prData, windowDays, repoNames) {
  const byRepo = {};
  for (const repo of repoNames) {
    byRepo[repo] = bucketWeekly(
      prData.filter((d) => d.repo === repo),
      windowDays
    );
  }
  return { all: bucketWeekly(prData, windowDays), byRepo };
}

// Builds the /summary response shape from already-enriched PR records.
// Shared by the normal route handler and a single-repo retry, so a targeted
// retry can recompute the aggregate without waiting for the next full fetch.
function buildSummaryResult(prData) {
  const cycleTimes = prData.map((d) => d.cycleTimeHours);
  const firstReviews = prData
    .filter((d) => d.firstReviewHours !== null)
    .map((d) => d.firstReviewHours);
  const sizes = prData.map((d) => d.sizeLines);

  const weeklyTrend = buildWeeklyTrend(
    prData,
    githubConfig.dataWindowDays,
    githubConfig.repos
  );

  return {
    cycleTime: { p75: percentile(cycleTimes, 75) },
    firstReview: { p75: percentile(firstReviews, 75) },
    prSize: { p75: percentile(sizes, 75) },
    weeklyTrend,
    prCount: prData.length,
    fetchedAt: new Date().toISOString(),
  };
}

// Builds the /repos response shape from already-enriched PR records.
function buildReposResult(prData) {
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

  return { repos, fetchedAt: new Date().toISOString() };
}

// --- Route handlers ---
async function getSummary(req, res, next) {
  try {
    const now = Date.now();
    if (summaryCache && now - summaryCacheTs < HIST_TTL) {
      console.log('[github] summary cache hit');
      return res.json(summaryCache);
    }

    const prData = await getSharedPRData();
    const result = buildSummaryResult(prData);

    summaryCache = result;
    summaryCacheTs = now;

    console.log(
      `[github] summary computed — ${prData.length} PRs, cycleTime P75=${result.cycleTime.p75}h, firstReview P75=${result.firstReview.p75}h`
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
    const result = buildReposResult(prData);

    reposCache = result;
    reposCacheTs = now;

    console.log(`[github] repos data computed — ${result.repos.length} repos`);
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

// Drafts aren't actually awaiting review yet, so they're excluded entirely.
// Shared by the normal route handler and a single-repo retry.
function mapOpenPRRecords(records, now) {
  return records
    .filter((rec) => !rec.isDraft)
    .map((rec) => {
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
      repos.map(
        (repo) => () =>
          withRepoRetry(repo, () => fetchRepoOpenPRs(config.github.org, repo))
            .then((prs) => {
              markRepoStatus(repo, 'open', true);
              return prs;
            })
            .catch((err) => {
              console.warn(
                `[github] ${repo} open PRs fetch failed: ${err.message}`
              );
              markRepoStatus(repo, 'open', false);
              return [];
            })
      ),
      7
    );

    const records = await fillTruncatedFiles(repoResults.flat());
    const allOpenPRs = mapOpenPRRecords(records, now);
    allOpenPRs.sort((a, b) => b.elapsedHours - a.elapsedHours);

    const result = { openPRs: allOpenPRs, fetchedAt: new Date().toISOString() };
    openPrsCache = result;
    openPrsCacheTs = now;

    console.log(
      `[github] open-prs fetched — ${allOpenPRs.length} open across all repos`
    );
    res.json(result);
  } catch (err) {
    console.error(`[github] getOpenPRs failed: ${err.message}`);
    next(err);
  }
}

function getProgress(req, res) {
  const failedRepos = Object.entries(repoFetchStatus)
    .filter(([, s]) => s.merged === false || s.open === false)
    .map(([repo]) => repo);
  res.json({ ...fetchProgress, failedRepos });
}

// Force-refetches a single repo (bypassing the cache) and patches the result
// into the existing summary/repos/open-prs caches in place. Lets a user hit
// "retry" on one failed repo without waiting out the full TTL or paying the
// cost of re-fetching every other repo that already succeeded.
async function retryRepo(req, res, next) {
  const { repo } = req.params;
  if (!githubConfig.repos.includes(repo)) {
    return res.status(404).json({ error: 'Unknown repo' });
  }

  try {
    const since = new Date(
      Date.now() - githubConfig.dataWindowDays * 24 * 60 * 60 * 1000
    );
    const [mergedResult, openResult] = await Promise.allSettled([
      withRepoRetry(repo, () =>
        fetchRepoMergedPRs(config.github.org, repo, since)
      ),
      withRepoRetry(repo, () => fetchRepoOpenPRs(config.github.org, repo)),
    ]);

    if (mergedResult.status === 'fulfilled' && prDataCache) {
      const fresh = enrichPRRecords(
        await fillTruncatedFiles(mergedResult.value)
      );
      prDataCache = [...prDataCache.filter((r) => r.repo !== repo), ...fresh];
      prDataCacheTs = Date.now();
      if (summaryCache) {
        summaryCache = buildSummaryResult(prDataCache);
        summaryCacheTs = Date.now();
      }
      if (reposCache) {
        reposCache = buildReposResult(prDataCache);
        reposCacheTs = Date.now();
      }
    } else if (mergedResult.status === 'rejected') {
      console.warn(
        `[github] ${repo} manual retry (merged) failed: ${mergedResult.reason?.message}`
      );
    }
    markRepoStatus(repo, 'merged', mergedResult.status === 'fulfilled');

    if (openResult.status === 'fulfilled' && openPrsCache) {
      const fresh = mapOpenPRRecords(
        await fillTruncatedFiles(openResult.value),
        Date.now()
      );
      const openPRs = [
        ...openPrsCache.openPRs.filter((p) => p.repo !== repo),
        ...fresh,
      ].sort((a, b) => b.elapsedHours - a.elapsedHours);
      openPrsCache = { openPRs, fetchedAt: new Date().toISOString() };
      openPrsCacheTs = Date.now();
    } else if (openResult.status === 'rejected') {
      console.warn(
        `[github] ${repo} manual retry (open) failed: ${openResult.reason?.message}`
      );
    }
    markRepoStatus(repo, 'open', openResult.status === 'fulfilled');

    const ok =
      mergedResult.status === 'fulfilled' && openResult.status === 'fulfilled';
    console.log(
      `[github] ${repo} manual retry ${ok ? 'succeeded' : 'partially failed'}`
    );
    res.json({
      repo,
      ok,
      merged: mergedResult.status === 'fulfilled',
      open: openResult.status === 'fulfilled',
    });
  } catch (err) {
    console.error(`[github] retryRepo(${repo}) failed: ${err.message}`);
    next(err);
  }
}

module.exports = { getSummary, getRepos, getOpenPRs, getProgress, retryRepo };

// Warm the cache on startup so the first page load is instant
(async () => {
  try {
    await getSharedPRData();
    console.log('[github] startup cache warm complete');
  } catch (err) {
    console.warn('[github] startup cache warmup failed:', err.message);
  }
})();
