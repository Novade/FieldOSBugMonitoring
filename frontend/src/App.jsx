import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { registerChartPlugins } from './utils/chartPlugins';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginPage } from './components/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { AllBugsPage } from './pages/AllBugsPage';
import { ClientBugsPage } from './pages/ClientBugsPage';
import { WorkspaceGlobalPage } from './pages/WorkspaceGlobalPage';

registerChartPlugins();

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
              <MainLayout>
                <Routes>
                  <Route path="bugs/*" element={<AllBugsPage />} />
                  <Route path="regression/*" element={<AllBugsPage />} />
                  <Route path="client-bugs" element={<Navigate to="/workspace/per-client" replace />} />
                  <Route path="workspace/global" element={<WorkspaceGlobalPage />} />
                  <Route path="workspace/per-client" element={<ClientBugsPage />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}
