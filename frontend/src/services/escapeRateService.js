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

// No cache: entries change on every save and must always reflect the data branch.
async function request(fn) {
  try {
    const res = await fn();
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

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
