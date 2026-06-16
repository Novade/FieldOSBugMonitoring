import { useEffect, useState } from 'react';
import { fetchMonitors, fetchHistory, fetchDailyData } from '../services/adminLabsService';

function useAsyncData(fetcher, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetcher()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

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
