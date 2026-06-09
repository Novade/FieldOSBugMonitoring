import { useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useJiraData } from './hooks/useJiraData';
import { registerChartPlugins } from './utils/chartPlugins';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPage } from './components/auth/LoginPage';
import { TopBar } from './components/layout/TopBar';
import { TabBar } from './components/layout/TabBar';
import { Banner } from './components/common/Banner';
import { BugsDashboard } from './components/dashboard/BugsDashboard';
import { RegressionDashboard } from './components/dashboard/RegressionDashboard';
import { BacklogTable } from './components/backlog/BacklogTable';

registerChartPlugins();

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

function Dashboard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeTab = PATH_TO_TAB[pathname] ?? 'bugs-dashboard';

  const { bugs, regressions, fetchedAt, loading, error } = useJiraData();
  const [bugDrill, setBugDrill] = useState(null);
  const [regDrill, setRegDrill] = useState(null);

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
      <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
        <TopBar fetchedAt={null} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[14px] text-[#6b7a99]">
              Fetching data from Jira…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f0f2f5]"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <TopBar fetchedAt={fetchedAt} />

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
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/bugs/dashboard" replace />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
