import { useLocation, useNavigate } from 'react-router-dom';
import { Bug, Building2 } from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'All Bugs',
    icon: Bug,
    path: '/bugs/dashboard',
    matchPrefixes: ['/bugs', '/regression'],
  },
  {
    label: 'Client Bugs',
    icon: Building2,
    path: '/client-bugs',
    matchPrefixes: ['/client-bugs'],
  },
];

export function LeftPane() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="w-48 bg-white border-r flex flex-col">
      <nav className="flex flex-col gap-1 pt-3 px-2">
        {NAV_ITEMS.map(({ label, icon: Icon, path, matchPrefixes }) => {
          const isActive = matchPrefixes.some((p) => pathname.startsWith(p));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[14px] font-medium w-full text-left transition-colors ${
                isActive
                  ? 'bg-[#e2e5ea] text-[#6b7a99]'
                  : 'text-[#6b7a99] hover:bg-[#f0f2f5]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
