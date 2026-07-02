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

export function fetchGHSummary() {
  return withCache('gh-summary', async () => {
    try {
      const res = await api.get('/api/github/summary');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err));
    }
  });
}

export function fetchGHRepos() {
  return withCache('gh-repos', async () => {
    try {
      const res = await api.get('/api/github/repos');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err));
    }
  });
}

export function fetchGHOpenPRs() {
  return withCache('gh-open-prs', async () => {
    try {
      const res = await api.get('/api/github/open-prs');
      return res.data;
    } catch (err) {
      throw new Error(extractError(err));
    }
  });
}

// Never cached — polled while the dashboard is loading to show live per-repo status.
export async function fetchGHProgress() {
  const res = await api.get('/api/github/progress');
  return res.data;
}

