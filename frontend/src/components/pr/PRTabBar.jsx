const TABS = [
  { id: 'by-repo', label: 'By Repo' },
  { id: 'open-prs', label: 'Open PRs' },
];

export function PRTabBar({ activeTab, onTabChange }) {
  return (
    <div className="inline-flex gap-1 p-1 mb-5 rounded-lg bg-[#eef1f6] border border-[#dde2ea]">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-2 text-[14px] rounded-md transition-all duration-150 cursor-pointer
              ${isActive
                ? 'bg-white text-[#3b6cb7] font-semibold shadow-sm'
                : 'bg-transparent text-[#6b7a99] font-medium hover:text-[#3b6cb7] hover:bg-white/50'
              }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
