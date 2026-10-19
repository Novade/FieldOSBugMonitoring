import { api, request } from './apiClient';

// No frontend cache: the backend already caches the Azure DevOps sync for 5 minutes.
export function fetchDeployments({ refresh = false } = {}) {
  return request(() => api.get('/api/deployments', { params: refresh ? { refresh: true } : {} }));
}
