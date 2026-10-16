import { useAsyncData } from './useAsyncData';
import { fetchMonitors, fetchHistory, fetchDailyData } from '../services/adminLabsService';

export function useMonitors() {
  const { data, loading, error } = useAsyncData(fetchMonitors, []);
  return { monitors: data?.monitors ?? [], loading, error };
}

export function useHistory({ monitorId, year }) {
  return useAsyncData(() => fetchHistory({ monitorId, year }), [monitorId, year]);
}

export function useDailyData({ monitorId, year, month }) {
  const { data, loading, error } = useAsyncData(
    () => month !== null ? fetchDailyData({ monitorId, year, month }) : Promise.resolve(null),
    [monitorId, year, month]
  );
  return { data, loading: month !== null && loading, error };
}
