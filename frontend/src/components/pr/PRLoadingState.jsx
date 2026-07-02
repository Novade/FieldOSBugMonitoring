const STATUS_ICON = {
  pending: <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-[#dde2ea]" />,
  fetching: (
    <span className="inline-block w-3.5 h-3.5 border-2 border-[#3b6cb7] border-t-transparent rounded-full animate-spin" />
  ),
  done: <span className="text-[#2e7d5e] text-[13px] font-bold">✓</span>,
  failed: <span className="text-[#c0392b] text-[13px] font-bold">!</span>,
};

const STATUS_LABEL = {
  pending: 'Queued',
  fetching: 'Fetching…',
  done: 'Done',
  failed: 'Failed — will retry next load',
};

export function PRLoadingState({ progress }) {
  const repoEntries = Object.entries(progress?.repos || {});

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6 flex items-center justify-center min-h-[500px]">
      <div className="text-center w-full max-w-[420px]">
        <div className="text-[16px] font-semibold text-[#1a2332] mb-1.5">
          Loading PR Cycle Data
        </div>
        <div className="text-[13px] text-[#6b7a99] mb-5">
          First load can take up to 30 seconds while we fetch and analyze
          recent pull requests across all repositories. Cached for 15 minutes,
          so your next visit will be instant.
        </div>

        {repoEntries.length > 0 ? (
          <div className="text-left bg-white border border-[#dde2ea] rounded-lg divide-y divide-[#eef1f6]">
            {repoEntries.map(([repo, status]) => (
              <div key={repo} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] text-[#1a2332] font-medium">{repo}</span>
                <span className="flex items-center gap-2 text-[12px] text-[#8896b0]">
                  {STATUS_LABEL[status] || status}
                  <span className="w-4 flex items-center justify-center">
                    {STATUS_ICON[status] || null}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-block w-8 h-8 border-4 border-[#3b6cb7] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
