import axios from 'axios';

const api = axios.create({ withCredentials: true });

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Session expired — reload to trigger auth redirect
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

function extractError(err) {
  return err.response?.data?.error || err.message || 'Unknown error';
}

export async function fetchBugs() {
  try {
    const res = await api.get('/api/jira/bugs');
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

export async function fetchRegressions() {
  try {
    const res = await api.get('/api/jira/regressions');
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}

export async function fetchWorkspaces() {
  try {
    const res = await api.get('/api/jira/workspaces');
    return res.data;
  } catch (err) {
    throw new Error(extractError(err));
  }
}
