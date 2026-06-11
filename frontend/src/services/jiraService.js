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

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = {};

function withCache(key, fn) {
  const now = Date.now();
  if (cache[key] && now - cache[key].ts < CACHE_TTL) {
    return cache[key].promise;
  }
  const promise = fn();
  cache[key] = { promise, ts: now };
  promise.catch(() => {
    delete cache[key];
  });
  return promise;
}

export function fetchBugs() {
  return withCache('bugs', async () => {
    try {
      const res = await api.get('/api/jira/bugs');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err));
    }
  });
}

export function fetchRegressions() {
  return withCache('regressions', async () => {
    try {
      const res = await api.get('/api/jira/regressions');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err));
    }
  });
}

export function fetchWorkspaces() {
  return withCache('workspaces', async () => {
    try {
      const res = await api.get('/api/jira/workspaces');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err));
    }
  });
}
