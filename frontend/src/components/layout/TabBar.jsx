const TABS = [
  {
    group: 'Bugs',
    groupStyle: 'bg-[#eef3fc]',
    labelColor: 'text-[#2d5a9e]',
    tabs: [
      { id: 'bugs-dashboard', label: 'Dashboard' },
      { id: 'bugs-backlog', label: 'Backlog' },
    ],
  },
  {
    group: 'Regression',
    groupStyle: 'bg-[#fff8ee]',
    labelColor: 'text-[#a06b00]',
    tabs: [
      { id: 'reg-dashboard', label: 'Dashboard' },
      { id: 'reg-backlog', label: 'Backlog' },
    ],
  },
];

// bg-[#f5f7fa] border-b border-[#dde2ea]

export function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="px-7 flex gap-0 items-end w-full">
      {TABS.map((group) => (
        <div
          key={group.group}
          className={`flex flex-col items-center rounded-t-lg px-2 pt-2 pb-0 flex-1 first:mr-2 ${group.groupStyle}`}
        >
          <span
            className={`text-[16px] font-bold uppercase tracking-[.8px] mb-1 ${group.labelColor}`}
          >
            {group.group}
          </span>
          <div className="flex w-full justify-center">
            {group.tabs.map((tab) => {
              const activeColor =
                group.group === 'Bugs'
                  ? 'text-brand border-b-brand font-semibold'
                  : 'text-[#b86e00] border-b-[#e6900a] font-semibold';
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-1 text-center px-7 py-[12px] text-[15px] font-medium border-b-[3px] -mb-px transition-colors duration-150 border-transparent cursor-pointer bg-transparent
                    ${
                      isActive ? activeColor : 'text-[#6b7a99] hover:text-brand'
                    }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
