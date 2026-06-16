const axios = require('axios');
const config = require('../config/env');
const adminLabsConfig = require('../config/adminLabs');

const adminLabsClient = axios.create({
  baseURL: adminLabsConfig.BASE_URL,
  headers: {
    'account-id': config.adminLabs.accountId,
    'api-key': config.adminLabs.apiKey,
    Accept: 'application/json',
  },
});

adminLabsClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      const e = new Error(err.response.data?.message || err.message);
      e.isAdminLabsError = true;
      e.status = err.response.status;
      return Promise.reject(e);
    }
    const e = new Error('Cannot reach AdminLabs API. Check your network connection.');
    e.isAdminLabsError = true;
    e.status = 503;
    return Promise.reject(e);
  }
);

function assertCredentials() {
  if (!config.adminLabs.apiKey || !config.adminLabs.accountId) {
    const e = new Error(
      'AdminLabs credentials not configured. Add ADMIN_LABS_API_KEY and ADMIN_LABS_ACCOUNT_ID to .env'
    );
    e.isAdminLabsError = true;
    e.status = 503;
    throw e;
  }
}

let monitorCache = null;
let monitorCacheTs = 0;
const MONITOR_CACHE_TTL = 60 * 60 * 1000;

async function getMonitorIds() {
  const now = Date.now();
  if (monitorCache && now - monitorCacheTs < MONITOR_CACHE_TTL) return monitorCache;

  const res = await adminLabsClient.get('/monitors');
  const monitors = Array.isArray(res.data) ? res.data : res.data.monitors || [];

  monitorCache = adminLabsConfig.KNOWN_MONITOR_NAMES.map((name) => {
    const found = monitors.find((m) => m.name === name);
    if (!found) {
      const e = new Error(`Monitor "${name}" not found in AdminLabs account`);
      e.isAdminLabsError = true;
      e.status = 404;
      throw e;
    }
    return { id: String(found.id), name };
  });
  monitorCacheTs = now;
  return monitorCache;
}

// Shared by getHistory and getDaily — resolves monitorId to target monitor list
async function resolveTargetMonitors(monitorId) {
  const allMonitors = await getMonitorIds();
  if (monitorId === 'all') return allMonitors;
  const targets = allMonitors.filter((m) => m.id === monitorId);
  if (!targets.length) {
    const e = new Error(`Unknown monitorId: ${monitorId}`);
    e.status = 400;
    throw e;
  }
  return targets;
}

// Limits concurrent outbound requests to avoid overwhelming the API
async function runWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function getMonitors(_req, res, next) {
  try {
    assertCredentials();
    const monitors = await getMonitorIds();
    res.json({ monitors });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    assertCredentials();

    const year = parseInt(req.query.year, 10);
    if (!year || year < 2000 || year > 2099) {
      return res.status(400).json({ error: 'year must be a valid 4-digit number (2000–2099).' });
    }

    const monitorId = req.query.monitorId || 'all';
    const targetMonitors = await resolveTargetMonitors(monitorId);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const tasks = targetMonitors.flatMap(({ id }) =>
      months.map((month) => async () => {
        const mm = String(month).padStart(2, '0');
        try {
          const r = await adminLabsClient.get(`/monitors/${id}/history/${year}/${mm}`);
          const days = Array.isArray(r.data) ? r.data : [];
          const count = days.length;
          return {
            monitorId: id,
            month,
            avgServiceLevel: count
              ? days.reduce((s, d) => s + (d['service-level'] || 0), 0) / count
              : null,
            totalDowntime: days.reduce((s, d) => s + (d['downtime-total'] || 0), 0),
            totalOutages: days.reduce((s, d) => s + (d['outages-total'] || 0), 0),
            dailyCount: count,
          };
        } catch (err) {
          if (err.isAdminLabsError && (err.status === 401 || err.status === 403 || err.status === 429 || err.status >= 500)) throw err;
          console.warn(`[adminlabs] Failed to fetch monitor ${id} ${year}/${mm}: ${err.message}`);
          return { monitorId: id, month, error: 'unavailable' };
        }
      })
    );

    const results = await runWithConcurrency(tasks, 4);

    const byMonth = months.map((month) => {
      const valid = results.filter((r) => r.month === month && !r.error && r.avgServiceLevel !== null);
      const errored = results.filter((r) => r.month === month && r.error);

      if (!valid.length) return { month, error: 'unavailable' };

      return {
        month,
        avgServiceLevel: parseFloat(
          (valid.reduce((s, r) => s + r.avgServiceLevel, 0) / valid.length).toFixed(3)
        ),
        totalDowntime: valid.reduce((s, r) => s + r.totalDowntime, 0),
        totalOutages: valid.reduce((s, r) => s + r.totalOutages, 0),
        dailyCount: Math.max(...valid.map((r) => r.dailyCount)),
        partial: errored.length > 0,
      };
    });

    console.log(`[adminlabs] History fetched — monitorId=${monitorId} year=${year}`);
    res.json({ monitorId, year, months: byMonth, fetchedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function getDaily(req, res, next) {
  try {
    assertCredentials();

    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || year < 2000 || year > 2099) {
      return res.status(400).json({ error: 'year must be a valid 4-digit number (2000–2099).' });
    }
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: 'month must be a number between 1 and 12.' });
    }

    const monitorId = req.query.monitorId || 'all';
    const targetMonitors = await resolveTargetMonitors(monitorId);
    const mm = String(month).padStart(2, '0');

    const results = await Promise.all(
      targetMonitors.map(async ({ id }) => {
        try {
          const r = await adminLabsClient.get(`/monitors/${id}/history/${year}/${mm}`);
          return Array.isArray(r.data) ? r.data : [];
        } catch (err) {
          if (err.isAdminLabsError && (err.status === 401 || err.status === 403 || err.status === 429 || err.status >= 500)) throw err;
          console.warn(`[adminlabs] getDaily failed monitor ${id} ${year}/${mm}: ${err.message}`);
          return [];
        }
      })
    );

    const byDate = {};
    results.forEach((days) => {
      days.forEach((d) => {
        const date = d['report-date'];
        if (!byDate[date]) {
          byDate[date] = { date, serviceLevels: [], downtime: 0, outages: 0 };
        }
        byDate[date].serviceLevels.push(d['service-level'] || 0);
        byDate[date].downtime += d['downtime-total'] || 0;
        byDate[date].outages += d['outages-total'] || 0;
      });
    });

    const days = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ date, serviceLevels, downtime, outages }) => ({
        date,
        serviceLevel: parseFloat(
          (serviceLevels.reduce((s, v) => s + v, 0) / serviceLevels.length).toFixed(3)
        ),
        downtime,
        outages,
      }));

    res.json({ monitorId, year, month, days });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMonitors, getHistory, getDaily };
