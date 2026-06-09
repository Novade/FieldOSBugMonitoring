import axios from 'axios';

const api = axios.create({ withCredentials: true });

export async function fetchSession() {
  const res = await api.get('/auth/session');
  return res.data;
}

export async function logout() {
  await api.delete('/auth/logout');
}

export function getLoginUrl() {
  return '/auth/atlassian';
}
