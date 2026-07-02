import { useEffect, useState } from 'react';
import { fetchGHSummary, fetchGHRepos, fetchGHOpenPRs, fetchGHProgress } from '../services/githubService';

export function useGitHubData() {
  const [summary, setSummary] = useState(null);
  const [repos, setRepos] = useState(null);
  const [openPrs, setOpenPrs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, reposRes, openPrsRes] = await Promise.all([
          fetchGHSummary(),
          fetchGHRepos(),
          fetchGHOpenPRs(),
        ]);
        if (!cancelled) {
          setSummary(summaryRes);
          setRepos(reposRes);
          setOpenPrs(openPrsRes);
          setFetchedAt(summaryRes.fetchedAt);
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

  // Poll real per-repo fetch status while loading, so the UI can show what's
  // actually happening on a cold-cache load instead of a generic spinner.
  useEffect(() => {
    if (!loading) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetchGHProgress();
        if (!cancelled) setProgress(res);
      } catch {
        // progress is best-effort — ignore failures
      }
    }

    poll();
    const interval = setInterval(poll, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [loading]);

  return { summary, repos, openPrs, loading, error, progress, fetchedAt };
}
