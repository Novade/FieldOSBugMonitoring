import { useCallback, useEffect, useRef, useState } from 'react';

// Runs `fetcher` whenever `deps` change and tracks its data, loading and error
// state. `reload` re-runs it while keeping the current data on screen.
export function useAsyncData(fetcher, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reloading = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    if (!reloading.current) setData(null);
    reloading.current = false;
    fetcher()
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey]);

  const reload = useCallback(() => {
    reloading.current = true;
    setReloadKey((k) => k + 1);
  }, []);

  return { data, loading, error, reload };
}
