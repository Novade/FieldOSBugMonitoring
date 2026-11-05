import { useEffect, useState } from 'react';
import { fetchBugs } from '../services/jiraService';
import { isQaBug } from '../utils/issueUtils';

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
        const bugsRes = await fetchBugs();
        if (!cancelled) {
          // Client-facing pages: QA-BUG (found in staging) never shown
          const issues = (bugsRes.issues || []).filter((b) => !isQaBug(b));
          const ws = Array.from(
            new Set(issues.flatMap((b) => b.w).filter(Boolean))
          ).sort((a, b) => a.localeCompare(b));
          setBugs(issues);
          setWorkspaces(ws);
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

  return { bugs, workspaces, loading, error };
}
