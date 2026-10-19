const axios = require('axios');
const config = require('../config/env');
const azdoConfig = require('../config/azureDevOps');
const store = require('../models/deploymentStore');
const { createTtlCache } = require('../utils/ttlCache');

const { PIPELINES } = azdoConfig;
const ORG_URL = `https://dev.azure.com/${encodeURIComponent(config.azureDevOps.org)}`;
const API_VERSION = '7.1';

const azdoClient = axios.create({
  baseURL: ORG_URL,
  auth: { username: '', password: config.azureDevOps.pat || '' },
  params: { 'api-version': API_VERSION },
  timeout: 20_000,
});

azdoClient.interceptors.response.use(
  (res) => {
    // An invalid PAT gets a 203 HTML sign-in page instead of a 401
    if (typeof res.data === 'string') return Promise.reject(azdoError('Azure DevOps sign-in required.', 401));
    return res;
  },
  (err) => {
    if (err.response) {
      return Promise.reject(azdoError(err.response.data?.message || err.message, err.response.status));
    }
    return Promise.reject(azdoError('Cannot reach Azure DevOps. Check your network connection.', 503));
  }
);

function azdoError(message, status) {
  const e = new Error(message);
  e.isAzureDevOpsError = true;
  e.status = status;
  return e;
}

function assertConfigured() {
  if (!config.azureDevOps.pat) {
    const e = azdoError('Azure DevOps is not configured. Add AZDO_PAT to .env.', 503);
    e.notConfigured = true;
    throw e;
  }
}

const pipelineKey = (p) => `${p.project}/${p.pipeline}`;
const project = (p) => `/${encodeURIComponent(p.project)}/_apis/build`;
const runUrl = (projectName, id) =>
  `${ORG_URL}/${encodeURIComponent(projectName)}/_build/results?buildId=${id}`;

// Pipeline ids rarely change; an hour lets a newly created pipeline show up without a restart.
const definitionCache = createTtlCache(60 * 60 * 1000);

function findDefinitionId(p) {
  return definitionCache.wrap(pipelineKey(p), async () => {
    const res = await azdoClient.get(`${project(p)}/definitions`, { params: { name: p.pipeline } });
    // Azure DevOps names are case-insensitive ("IOS" and "iOS" are the same pipeline)
    const name = p.pipeline.toLowerCase();
    return res.data.value.find((d) => d.name.toLowerCase() === name)?.id ?? null;
  });
}

// Latest completed runs of one pipeline, or null when the pipeline doesn't exist.
async function fetchRuns(p) {
  const definitionId = await findDefinitionId(p);
  if (definitionId === null) return null;
  const res = await azdoClient.get(`${project(p)}/builds`, {
    params: {
      definitions: definitionId,
      statusFilter: 'completed',
      queryOrder: 'finishTimeDescending',
      $top: azdoConfig.RUNS_PER_PIPELINE,
    },
  });
  return res.data.value.map((b) => ({
    id: b.id,
    pipeline: pipelineKey(p),
    result: b.result,
    finishTime: b.finishTime,
    buildNumber: b.buildNumber,
    branch: (b.sourceBranch || '').replace(/^refs\/heads\//, ''),
    commit: (b.sourceVersion || '').slice(0, 8),
  }));
}

const environmentCache = createTtlCache(azdoConfig.ENVIRONMENT_CACHE_TTL);
const environmentsApi = (p) => `/${encodeURIComponent(p.project)}/_apis/distributedtask/environments`;
const ENVIRONMENT_API_VERSION = '7.1-preview.1';

// Every deployment job record of one environment, following continuation tokens.
function fetchEnvironmentRecords(p) {
  return environmentCache.wrap(`${p.project}/${p.environment}`, async () => {
    const list = await azdoClient.get(environmentsApi(p), {
      params: { name: p.environment, 'api-version': ENVIRONMENT_API_VERSION },
    });
    const environment = list.data.value.find((e) => e.name.toLowerCase() === p.environment.toLowerCase());
    if (!environment) return [];

    const records = [];
    let continuationToken;
    do {
      const res = await azdoClient.get(`${environmentsApi(p)}/${environment.id}/environmentdeploymentrecords`, {
        params: { top: 1000, continuationToken, 'api-version': ENVIRONMENT_API_VERSION },
      });
      records.push(...res.data.value);
      continuationToken = res.headers['x-ms-continuationtoken'];
    } while (continuationToken);
    return records;
  });
}

// Runs of one pipeline rebuilt from its environment's deployment history. An
// environment can be shared by several pipelines and holds one record per job
// attempt (Backend Production deploys 3 regions per run), so records are grouped
// by run and only each job's last attempt counts: the run succeeded only when
// every job did, matching how the pipeline itself reports the run.
async function fetchEnvironmentRuns(p) {
  if (!p.environment) return [];
  const name = p.pipeline.toLowerCase();
  const records = (await fetchEnvironmentRecords(p)).filter(
    (r) => r.finishTime && r.definition?.name?.toLowerCase() === name
  );

  const jobsByRun = new Map();
  for (const r of records) {
    const jobs = jobsByRun.get(r.owner.id) ?? new Map();
    const job = `${r.stageName}/${r.jobName}`;
    if (!jobs.has(job) || r.finishTime > jobs.get(job).finishTime) jobs.set(job, r);
    jobsByRun.set(r.owner.id, jobs);
  }

  return [...jobsByRun.entries()].map(([id, jobs]) => {
    const last = [...jobs.values()];
    const failed = last.find((r) => r.result !== 'succeeded');
    return {
      id,
      pipeline: pipelineKey(p),
      result: failed ? failed.result : 'succeeded',
      finishTime: last.reduce((max, r) => (r.finishTime > max ? r.finishTime : max), ''),
      buildNumber: last[0].owner.name,
    };
  });
}

const byFinishTimeDesc = (a, b) => b.finishTime.localeCompare(a.finishTime);
const runKey = (r) => `${r.pipeline}#${r.id}`;

// Fetches every pipeline's runs and commits any not yet stored. Azure DevOps
// deletes old runs, so the stored file is what keeps the monthly history.
// Runs from the runs list win over the same run rebuilt from environment
// history, since only they carry the branch and commit.
async function sync() {
  const [fetched, fromEnvironments] = await Promise.all([
    Promise.all(PIPELINES.map(fetchRuns)),
    Promise.all(PIPELINES.map(fetchEnvironmentRuns)),
  ]);
  const missing = PIPELINES.filter((_, i) => fetched[i] === null).map(pipelineKey);
  const runs = fetched.flatMap((r) => r ?? []);
  const listed = new Set(runs.map(runKey));
  runs.push(...fromEnvironments.flat().filter((r) => !listed.has(runKey(r))));

  const data = await store.update((current) => {
    const known = new Set(current.runs.map(runKey));
    const fresh = runs.filter((r) => !known.has(runKey(r)));
    if (!fresh.length) return null;
    return { runs: [...current.runs, ...fresh].sort(byFinishTimeDesc) };
  }, 'Sync deployment runs');

  return { ...data, missing, syncedAt: new Date().toISOString() };
}

const syncCache = createTtlCache(azdoConfig.SYNC_CACHE_TTL);
const cachedSync = () => syncCache.wrap('sync', sync);

const monthOf = (iso) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: azdoConfig.TIME_ZONE, year: 'numeric', month: '2-digit' })
    .format(new Date(iso))
    .slice(0, 7);

function toRun(run, p) {
  return run && { ...run, url: runUrl(p.project, run.id) };
}

// Last successful and latest run of each pipeline, from the stored history.
function buildPipelines(runs, missing) {
  return PIPELINES.map((p) => {
    const own = runs.filter((r) => r.pipeline === pipelineKey(p));
    return {
      group: p.group,
      platform: p.platform ?? null,
      env: p.env,
      name: p.pipeline,
      notFound: missing.includes(pipelineKey(p)),
      lastSuccess: toRun(own.find((r) => r.result === 'succeeded'), p),
      latest: toRun(own[0], p),
    };
  });
}

// Successful runs per month and group, from the first stored run up to this month.
function buildMonthly(runs) {
  const groups = [...new Set(PIPELINES.map((p) => p.group))];
  const pipelineByKey = new Map(PIPELINES.map((p) => [pipelineKey(p), p]));
  const counts = new Map();

  for (const run of runs) {
    const p = pipelineByKey.get(run.pipeline);
    if (!p || run.result !== 'succeeded') continue;
    const month = monthOf(run.finishTime);
    if (!counts.has(month)) counts.set(month, { prod: {}, staging: {} });
    const bucket = counts.get(month)[p.env];
    bucket[p.group] = (bucket[p.group] || 0) + 1;
  }

  if (!runs.length) return { groups, months: [] };

  const months = [];
  const last = monthOf(new Date().toISOString());
  for (let m = monthOf(runs[runs.length - 1].finishTime); m <= last; m = nextMonth(m)) {
    const { prod, staging } = counts.get(m) || { prod: {}, staging: {} };
    const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    months.push({ month: m, prod, staging, prodTotal: sum(prod), stagingTotal: sum(staging) });
  }
  return { groups, months };
}

function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

async function getDeployments(req, res, next) {
  try {
    assertConfigured();
    if (req.query.refresh === 'true') syncCache.clear();
    const { runs, missing, syncedAt } = await cachedSync();
    res.json({
      pipelines: buildPipelines(runs, missing),
      monthly: buildMonthly(runs),
      syncedAt,
    });
  } catch (err) {
    next(err);
  }
}

// Keeps the history growing even when nobody opens the page for longer than
// the retention window. Safe because the Container App runs a single replica.
function startScheduledSync() {
  if (!config.azureDevOps.pat) return;
  const run = () => {
    syncCache.clear();
    cachedSync().catch((err) => console.error(`[deployments] Scheduled sync failed — ${err.message}`));
  };
  run();
  setInterval(run, azdoConfig.SYNC_INTERVAL).unref();
}

module.exports = { getDeployments, startScheduledSync };
