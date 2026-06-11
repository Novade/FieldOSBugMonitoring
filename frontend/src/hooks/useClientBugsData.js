import { useEffect, useState } from 'react';
import { fetchBugs, fetchWorkspaces } from '../services/jiraService';

export function useClientBugsData() {
  const [bugs, setBugs] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [bugsRes, wsRes] = await Promise.all([fetchBugs(), fetchWorkspaces()]);
        if (!cancelled) {
          setBugs(bugsRes.issues);
          setWorkspaces(wsRes.workspaces);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { bugs, workspaces, loading, error };
}
