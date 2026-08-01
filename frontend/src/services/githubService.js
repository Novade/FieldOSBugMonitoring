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

// Drops the cached summary/repos/open-prs promises so the next fetch call
// re-hits the backend instead of returning the stale in-memory result — used
// after a manual repo retry, since the backend cache was just patched but
// this tab's own cache doesn't know that yet.
export function invalidateGHCache() {
  delete cache['gh-summary'];
  delete cache['gh-repos'];
  delete cache['gh-open-prs'];
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

// Force-refetches one repo, bypassing the backend cache. Never cached itself.
export async function retryGHRepo(repo) {
  try {
    const res = await api.post(`/api/github/repos/${encodeURIComponent(repo)}/retry`);
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

