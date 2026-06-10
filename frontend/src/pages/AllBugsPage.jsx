import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useJiraData } from '../hooks/useJiraData';
import { TabBar } from '../components/layout/TabBar';
import { Banner } from '../components/common/Banner';
import { BugsDashboard } from '../components/dashboard/BugsDashboard';
import { RegressionDashboard } from '../components/dashboard/RegressionDashboard';
import { BacklogTable } from '../components/backlog/BacklogTable';
import { SyncTimeContext } from '../components/layout/MainLayout';

const PATH_TO_TAB = {
  '/bugs/dashboard': 'bugs-dashboard',
  '/bugs/backlog': 'bugs-backlog',
  '/regression/dashboard': 'reg-dashboard',
  '/regression/backlog': 'reg-backlog',
};

const TAB_TO_PATH = {
  'bugs-dashboard': '/bugs/dashboard',
  'bugs-backlog': '/bugs/backlog',
  'reg-dashboard': '/regression/dashboard',
  'reg-backlog': '/regression/backlog',
};

export function AllBugsPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeTab =
    PATH_TO_TAB[pathname] ??
    (pathname.startsWith('/regression') ? 'reg-dashboard' : 'bugs-dashboard');
  const setSyncTime = useContext(SyncTimeContext);

  const { bugs, regressions, fetchedAt, loading, error } = useJiraData();
  const [bugDrill, setBugDrill] = useState(null);
  const [regDrill, setRegDrill] = useState(null);

  useEffect(() => {
    if (fetchedAt && setSyncTime) setSyncTime(fetchedAt);
  }, [fetchedAt, setSyncTime]);

  function handleTabChange(tabId) {
    navigate(TAB_TO_PATH[tabId]);
  }

  function handleBugDrillTo(key, val, label) {
    setBugDrill({ key, val, label });
    navigate(TAB_TO_PATH['bugs-backlog']);
  }

  function handleRegDrillTo(key, val, label) {
    setRegDrill({ key, val, label });
    navigate(TAB_TO_PATH['reg-backlog']);
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
    <div className="max-w-[1380px] mx-auto">
      <Banner message={error} visible={!!error} />
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="px-7 py-6">
        {activeTab === 'bugs-dashboard' && (
          <BugsDashboard issues={bugs} onDrillTo={handleBugDrillTo} />
        )}
        {activeTab === 'bugs-backlog' && (
          <BacklogTable
            issues={bugs}
            drill={bugDrill}
            onClearDrill={() => setBugDrill(null)}
          />
        )}
        {activeTab === 'reg-dashboard' && (
          <RegressionDashboard
            issues={regressions}
            onDrillTo={handleRegDrillTo}
          />
        )}
        {activeTab === 'reg-backlog' && (
          <BacklogTable
            issues={regressions}
            drill={regDrill}
            onClearDrill={() => setRegDrill(null)}
          />
        )}
      </div>
    </div>
  );
}
