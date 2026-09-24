import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useJiraData } from '../hooks/useJiraData';
import { Banner } from '../components/common/Banner';
import { BugsDashboard } from '../components/dashboard/BugsDashboard';
import { BacklogTable } from '../components/backlog/BacklogTable';
import { SyncTimeContext } from '../components/layout/MainLayout';

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'backlog', label: 'Backlog' },
];

const PATH_TO_TAB = {
  '/bugs/dashboard': 'dashboard',
  '/bugs/backlog': 'backlog',
};

const TAB_TO_PATH = {
  dashboard: '/bugs/dashboard',
  backlog: '/bugs/backlog',
};

export function AllBugsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeTab = PATH_TO_TAB[pathname] ?? 'dashboard';
  const setSyncTime = useContext(SyncTimeContext);

  const { bugs, fetchedAt, loading, error } = useJiraData();
  const [bugDrill, setBugDrill] = useState(null);

  useEffect(() => {
    if (fetchedAt && setSyncTime) setSyncTime(fetchedAt);
  }, [fetchedAt, setSyncTime]);

  function handleTabChange(tabId) {
    setBugDrill(null);
    navigate(TAB_TO_PATH[tabId]);
  }

  function handleBugDrillTo(key, val, label) {
    setBugDrill({ key, val, label });
    navigate(TAB_TO_PATH.backlog);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[14px] text-[#6b7a99]">Fetching data from Jira…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      <Banner message={error} visible={!!error} />

      <div className="flex gap-1.5 mb-5">
        {SECTIONS.map((section) => {
          const isActive = activeTab === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => handleTabChange(section.id)}
              className={`px-4 py-2 rounded-md text-[14px] font-medium transition-colors ${
                isActive ? 'bg-[#e2e5ea] text-[#1a2332]' : 'text-[#6b7a99] hover:bg-[#f0f2f5]'
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'dashboard' && <BugsDashboard issues={bugs} onDrillTo={handleBugDrillTo} />}
      {activeTab === 'backlog' && (
        <BacklogTable issues={bugs} drill={bugDrill} onClearDrill={() => setBugDrill(null)} />
      )}
    </div>
  );
}
