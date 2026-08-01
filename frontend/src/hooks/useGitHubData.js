import { useEffect, useState } from 'react';
import {
  fetchGHSummary,
  fetchGHRepos,
  fetchGHOpenPRs,
  fetchGHProgress,
  retryGHRepo,
  invalidateGHCache,
} from '../services/githubService';

export function useGitHubData() {
  const [summary, setSummary] = useState(null);
  const [repos, setRepos] = useState(null);
  const [openPrs, setOpenPrs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [failedRepos, setFailedRepos] = useState([]);
  const [retryingRepos, setRetryingRepos] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, reposRes, openPrsRes, progressRes] = await Promise.all([
          fetchGHSummary(),
          fetchGHRepos(),
          fetchGHOpenPRs(),
          fetchGHProgress(),
        ]);
        if (!cancelled) {
          setSummary(summaryRes);
          setRepos(reposRes);
          setOpenPrs(openPrsRes);
          setFetchedAt(summaryRes.fetchedAt);
          setFailedRepos(progressRes.failedRepos || []);
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

  // Force-refetches a single failed repo and, if it succeeds, pulls in the
  // now-patched summary/repos/open-prs so the dashboard updates in place —
  // no need to reload the whole page or wait for the next cache cycle.
  async function retry(repo) {
    setRetryingRepos((prev) => [...prev, repo]);
    try {
      const result = await retryGHRepo(repo);
      if (result.ok) {
        invalidateGHCache();
        const [summaryRes, reposRes, openPrsRes] = await Promise.all([
          fetchGHSummary(),
          fetchGHRepos(),
          fetchGHOpenPRs(),
        ]);
        setSummary(summaryRes);
        setRepos(reposRes);
        setOpenPrs(openPrsRes);
        setFetchedAt(summaryRes.fetchedAt);
        setFailedRepos((prev) => prev.filter((r) => r !== repo));
      }
    } catch {
      // still failed — leave it in failedRepos so the button stays available
    } finally {
      setRetryingRepos((prev) => prev.filter((r) => r !== repo));
    }
  }

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

  return { summary, repos, openPrs, loading, error, progress, fetchedAt, failedRepos, retryingRepos, retry };
}
