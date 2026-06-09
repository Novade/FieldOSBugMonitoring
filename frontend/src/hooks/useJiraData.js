import { useEffect, useState } from 'react';
import { fetchBugs, fetchRegressions } from '../services/jiraService';

export function useJiraData() {
  const [bugs, setBugs] = useState([]);
  const [regressions, setRegressions] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [bugsRes, regRes] = await Promise.all([
          fetchBugs(),
          fetchRegressions(),
        ]);
        if (!cancelled) {
          setBugs(bugsRes.issues);
          setRegressions(regRes.issues);
          setFetchedAt(bugsRes.fetchedAt);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { bugs, regressions, fetchedAt, loading, error };
}
