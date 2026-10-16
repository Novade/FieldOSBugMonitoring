import { useCallback, useRef } from 'react';
import { useAsyncData } from './useAsyncData';
import { fetchDeployments } from '../services/deploymentService';

// `refresh` forces the backend to re-sync with Azure DevOps instead of using its cache.
export function useDeployments() {
  const forceRefresh = useRef(false);
  const { data, loading, error, reload } = useAsyncData(() => {
    const refresh = forceRefresh.current;
    forceRefresh.current = false;
    return fetchDeployments({ refresh });
  }, []);

  const refresh = useCallback(() => {
    forceRefresh.current = true;
    reload();
  }, [reload]);

  return { data, loading, error, refresh };
}
