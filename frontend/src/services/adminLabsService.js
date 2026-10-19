import { api, request, withCache } from './apiClient';

export function fetchMonitors() {
  return withCache('adminlabs-monitors', () => request(() => api.get('/api/adminlabs/monitors')));
}

export function fetchHistory({ monitorId, year }) {
  return withCache(`adminlabs-history-${monitorId}-${year}`, () =>
    request(() => api.get('/api/adminlabs/history', { params: { monitorId, year } }))
  );
}

export function fetchDailyData({ monitorId, year, month }) {
  return withCache(`adminlabs-daily-${monitorId}-${year}-${month}`, () =>
    request(() => api.get('/api/adminlabs/daily', { params: { monitorId, year, month } }))
  );
}
