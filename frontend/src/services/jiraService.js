import { api, request, withCache } from './apiClient';

export function fetchBugs() {
  return withCache('bugs', () => request(() => api.get('/api/jira/bugs')));
}

export function fetchWorkspaces() {
  return withCache('workspaces', () => request(() => api.get('/api/jira/workspaces')));
}
