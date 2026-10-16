import { api, request } from './apiClient';

// No cache: entries change on every save and must always reflect the data branch.

export function fetchEscapeRates() {
  return request(() => api.get('/api/escape-rates'));
}

export function createEscapeRate(data) {
  return request(() => api.post('/api/escape-rates', data));
}

export function updateEscapeRate(id, data) {
  return request(() => api.put(`/api/escape-rates/${id}`, data));
}

export function recomputeEscapeRate(id) {
  return request(() => api.post(`/api/escape-rates/${id}/recompute`));
}

export function recomputeAllEscapeRates() {
  return request(() => api.post('/api/escape-rates/recompute-all'));
}

export function deleteEscapeRate(id) {
  return request(() => api.delete(`/api/escape-rates/${id}`));
}

export function fetchEscapeRateIssues(id, scope) {
  return request(() => api.get(`/api/escape-rates/${id}/issues`, { params: { scope } }));
}
