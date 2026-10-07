const crypto = require('crypto');
const { jiraClient } = require('./jiraController');
const jiraConfig = require('../config/jira');
const { transformIssue } = require('../models/issueModel');
const { buildJql } = require('../config/escapeRate');
const store = require('../models/escapeRateStore');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Rejects impossible dates like 2026-02-31, which JS would silently roll over to March 3
function isValidDate(value) {
  if (!DATE_RE.test(value || '')) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !isNaN(d) && d.toISOString().slice(0, 10) === value;
}
const SCOPES = ['prod', 'test', 'total'];

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  err.isEscapeRateError = true;
  return err;
}

// The shared errorHandler hides messages for non-400 statuses, so validation and
// GitHub storage errors are answered here; Jira errors still go to errorHandler.
function handle(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err.isEscapeRateError || err.isEscapeRateStoreError) {
        return res.status(err.status).json({ error: err.message });
      }
      next(err);
    }
  };
}

function sortEntries(entries) {
  return [...entries].sort(
    (a, b) => b.prodFrom.localeCompare(a.prodFrom) || b.version.localeCompare(a.version, undefined, { numeric: true })
  );
}

function parseInput(body) {
  const version = String(body?.version ?? '').trim();
  if (!version) throw httpError(400, 'Version is required.');

  const dates = {};
  for (const field of ['testFrom', 'testTo', 'prodFrom', 'prodTo']) {
    const value = body?.[field];
    if (!isValidDate(value)) throw httpError(400, `${field} must be a valid date.`);
    dates[field] = value;
  }
  if (dates.testFrom > dates.testTo) throw httpError(400, 'Bugs during testing: Date from must be on or before Date to.');
  if (dates.prodFrom > dates.prodTo) throw httpError(400, 'Bugs after prod: Date from must be on or before Date to.');

  return { version, ...dates };
}

function assertUniqueVersion(entries, version, ownId) {
  const taken = entries.some((e) => e.id !== ownId && e.version.toLowerCase() === version.toLowerCase());
  if (taken) throw httpError(409, `Version ${version} already exists.`);
}

function findEntry(entries, id) {
  const entry = entries.find((e) => e.id === id);
  if (!entry) throw httpError(404, 'Escape rate entry not found. It may have been deleted.');
  return entry;
}

async function countIssues(jql) {
  let count = 0;
  let nextPageToken;
  while (true) {
    const params = { jql, maxResults: 1000 };
    if (nextPageToken) params.nextPageToken = nextPageToken;
    const res = await jiraClient.get('/search/jql', { params });
    const { issues, isLast, nextPageToken: token } = res.data;
    count += issues.length;
    if (isLast || !token || !issues.length) break;
    nextPageToken = token;
  }
  return count;
}

// Same paging and transform as jiraController's fetchAllIssues, plus the parent
// field for the Epic column. Kept here so the shared Jira field list is untouched.
async function fetchIssuesWithEpic(jql) {
  const issues = [];
  let nextPageToken;
  while (true) {
    const params = { jql, fields: [...jiraConfig.FIELDS, 'parent'].join(','), maxResults: jiraConfig.PAGE_SIZE };
    if (nextPageToken) params.nextPageToken = nextPageToken;
    const res = await jiraClient.get('/search/jql', { params });
    const { issues: page, isLast, nextPageToken: token } = res.data;
    for (const raw of page) {
      const parent = raw.fields.parent;
      const isEpic = parent?.fields?.issuetype?.name === 'Epic';
      issues.push({ ...transformIssue(raw), epic: isEpic ? { k: parent.key, s: parent.fields.summary || '' } : null });
    }
    if (isLast || !token || !page.length) break;
    nextPageToken = token;
  }
  return issues;
}

async function computeCounts({ prodFrom, prodTo, testFrom, testTo }) {
  const [prodCount, testCount] = await Promise.all([
    countIssues(buildJql({ scope: 'prod', from: prodFrom, to: prodTo })),
    countIssues(buildJql({ scope: 'test', from: testFrom, to: testTo })),
  ]);
  const total = prodCount + testCount;
  const rate = total ? Math.round((prodCount / total) * 1000) / 10 : null;
  return { prodCount, testCount, total, rate, computedAt: new Date().toISOString() };
}

const userName = (req) => req.session.user?.displayName || 'Unknown';

const listEscapeRates = handle(async (req, res) => {
  const { entries } = await store.readAll();
  res.json({ entries: sortEntries(entries) });
});

const createEscapeRate = handle(async (req, res) => {
  const input = parseInput(req.body);
  assertUniqueVersion((await store.readAll()).entries, input.version);

  const entry = {
    id: crypto.randomUUID(),
    ...input,
    ...(await computeCounts(input)),
    createdBy: userName(req),
    updatedBy: userName(req),
  };
  const entries = await store.update((current) => {
    assertUniqueVersion(current, entry.version);
    return [...current, entry];
  }, `Add escape rate ${entry.version}`);

  console.log(`[escape-rate] Added ${entry.version}: ${entry.prodCount}/${entry.total}`);
  res.status(201).json({ entry, entries: sortEntries(entries) });
});

const updateEscapeRate = handle(async (req, res) => {
  const { id } = req.params;
  const input = parseInput(req.body);
  const { entries: current } = await store.readAll();
  findEntry(current, id);
  assertUniqueVersion(current, input.version, id);

  const counts = await computeCounts(input);
  let entry;
  const entries = await store.update((latest) => {
    const existing = findEntry(latest, id);
    assertUniqueVersion(latest, input.version, id);
    entry = { ...existing, ...input, ...counts, updatedBy: userName(req) };
    return latest.map((e) => (e.id === id ? entry : e));
  }, `Edit escape rate ${input.version}`);

  res.json({ entry, entries: sortEntries(entries) });
});

const recomputeEscapeRate = handle(async (req, res) => {
  const { id } = req.params;
  const saved = findEntry((await store.readAll()).entries, id);
  const counts = await computeCounts(saved);
  let entry;
  const entries = await store.update((latest) => {
    entry = { ...findEntry(latest, id), ...counts, updatedBy: userName(req) };
    return latest.map((e) => (e.id === id ? entry : e));
  }, `Recompute escape rate ${saved.version}`);

  res.json({ entry, entries: sortEntries(entries) });
});

// Recomputes every entry in one commit. Runs a few entries at a time so a
// long list doesn't hit Jira's rate limit.
const RECOMPUTE_ALL_CONCURRENCY = 3;

const recomputeAllEscapeRates = handle(async (req, res) => {
  const { entries: saved } = await store.readAll();
  const countsById = {};
  for (let i = 0; i < saved.length; i += RECOMPUTE_ALL_CONCURRENCY) {
    const batch = saved.slice(i, i + RECOMPUTE_ALL_CONCURRENCY);
    const results = await Promise.all(batch.map(computeCounts));
    batch.forEach((e, j) => (countsById[e.id] = results[j]));
  }
  const entries = await store.update(
    (latest) => latest.map((e) => (countsById[e.id] ? { ...e, ...countsById[e.id], updatedBy: userName(req) } : e)),
    `Recompute all escape rates (${saved.length})`
  );

  console.log(`[escape-rate] Recomputed all ${saved.length} entries`);
  res.json({ entries: sortEntries(entries) });
});

const deleteEscapeRate = handle(async (req, res) => {
  const { id } = req.params;
  const saved = findEntry((await store.readAll()).entries, id);
  const entries = await store.update((latest) => {
    findEntry(latest, id);
    return latest.filter((e) => e.id !== id);
  }, `Delete escape rate ${saved.version}`);

  console.log(`[escape-rate] Deleted ${saved.version}`);
  res.json({ entries: sortEntries(entries) });
});

const getEscapeRateIssues = handle(async (req, res) => {
  const { scope } = req.query;
  if (!SCOPES.includes(scope)) throw httpError(400, `scope must be one of ${SCOPES.join(', ')}.`);
  const entry = findEntry((await store.readAll()).entries, req.params.id);

  const fetchScope = async (s) => {
    const from = s === 'prod' ? entry.prodFrom : entry.testFrom;
    const to = s === 'prod' ? entry.prodTo : entry.testTo;
    const issues = await fetchIssuesWithEpic(buildJql({ scope: s, from, to }));
    return issues.map((issue) => ({ ...issue, src: s }));
  };

  const groups = await Promise.all((scope === 'total' ? ['prod', 'test'] : [scope]).map(fetchScope));
  res.json({ issues: groups.flat(), fetchedAt: new Date().toISOString() });
});

module.exports = {
  listEscapeRates,
  createEscapeRate,
  updateEscapeRate,
  recomputeEscapeRate,
  recomputeAllEscapeRates,
  deleteEscapeRate,
  getEscapeRateIssues,
};
