import axios from 'axios';

const api = axios.create({ withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

function extractError(err) {
  return err.response?.data?.error || err.message || 'Unknown error';
}

const CACHE_TTL = 5 * 60 * 1000;
const cache = {};

function withCache(key, fn) {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < CACHE_TTL) return cache[key].promise;
  const promise = fn().catch((err) => {
    delete cache[key];
    throw new Error(extractError(err));
  });
  cache[key] = { promise, ts: now };
  return promise;
}

export function fetchMonitors() {
  return withCache('adminlabs-monitors', () =>
    api.get('/api/adminlabs/monitors').then((r) => r.data)
  );
}

export function fetchHistory({ monitorId, year }) {
  return withCache(`adminlabs-history-${monitorId}-${year}`, () =>
    api.get('/api/adminlabs/history', { params: { monitorId, year } }).then((r) => r.data)
  );
}

export function fetchDailyData({ monitorId, year, month }) {
  return withCache(`adminlabs-daily-${monitorId}-${year}-${month}`, () =>
    api.get('/api/adminlabs/daily', { params: { monitorId, year, month } }).then((r) => r.data)
  );
}
