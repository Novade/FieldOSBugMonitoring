export function FailedRepoNotice({ failedRepos, retryingRepos, onRetry }) {
  if (!failedRepos?.length) return null;

  return (
    <div className="flex flex-col gap-2 bg-danger-tint border border-danger-line rounded-md px-4 py-3 mb-5">
      {failedRepos.map((repo) => {
        const isRetrying = retryingRepos.includes(repo);
        return (
          <div key={repo} className="flex items-center justify-between gap-3 text-[13px] text-danger-ink">
            <span>
              <strong className="font-semibold">{repo}</strong> couldn't load — showing partial data.
            </span>
            <button
              onClick={() => onRetry(repo)}
              disabled={isRetrying}
              className="px-3 py-1 bg-surface border border-danger-line rounded-md text-[12px] font-medium text-danger-ink hover:bg-danger-tint disabled:opacity-60 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isRetrying ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
