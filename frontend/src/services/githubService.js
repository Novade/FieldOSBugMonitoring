import { api, request, withCache, clearCache } from './apiClient';

// Drops the cached summary/repos/open-prs promises so the next fetch call
// re-hits the backend instead of returning the stale in-memory result — used
// after a manual repo retry, since the backend cache was just patched but
// this tab's own cache doesn't know that yet.
export function invalidateGHCache() {
  clearCache(['gh-summary', 'gh-repos', 'gh-open-prs']);
}

export function fetchGHSummary() {
  return withCache('gh-summary', () => request(() => api.get('/api/github/summary')));
}

export function fetchGHRepos() {
  return withCache('gh-repos', () => request(() => api.get('/api/github/repos')));
}

export function fetchGHOpenPRs() {
  return withCache('gh-open-prs', () => request(() => api.get('/api/github/open-prs')));
}

// Never cached — polled while the dashboard is loading to show live per-repo status.
export async function fetchGHProgress() {
  const res = await api.get('/api/github/progress');
  return res.data;
}

// Force-refetches one repo, bypassing the backend cache. Never cached itself.
export function retryGHRepo(repo) {
  return request(() => api.post(`/api/github/repos/${encodeURIComponent(repo)}/retry`));
}

// On-demand — only fetched when the "show merged/closed" toggle is switched
// on, so it doesn't add to the default page load.
export function fetchGHResolvedPRs() {
  return withCache('gh-resolved-prs', () => request(() => api.get('/api/github/resolved-prs')));
}
