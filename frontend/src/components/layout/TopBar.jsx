import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatSyncTime } from '../../utils/dateUtils';
import { Moon, Sun } from 'lucide-react';
import Logo from '../../assets/logo.svg?react';
import { useTheme } from '../../context/ThemeContext';

// Pages that show their own inline "last sync" label instead of the TopBar one
const OWN_SYNC_LABEL_PREFIXES = ['/pr-cycles', '/deployments'];

export function TopBar({ fetchedAt }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const { pathname } = useLocation();
  const hideForRoute = OWN_SYNC_LABEL_PREFIXES.some((p) => pathname.startsWith(p));
  const syncLabel = fetchedAt && !hideForRoute ? formatSyncTime(fetchedAt) : null;

  return (
    <div className="flex items-center justify-between px-7 py-2 bg-brand border-b border-brand-dark flex-wrap gap-2.5">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-12 h-12">
          <div className="absolute inset-0 bg-white rounded-full" />
          <Logo className="relative h-10 w-auto" />
        </div>
        {syncLabel && <p className="text-[15px] text-white/70">{syncLabel}</p>}
      </div>
      {user && (
        <div className="flex items-center gap-5">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-8 h-8 rounded-full border-2 border-white/30"
            />
          )}
          <span className="text-[15px] text-white/80">{user.displayName}</span>
          <button
            onClick={logout}
            className="text-[13px] text-white/70 hover:text-white border border-white/30 hover:border-white/60 rounded px-3 py-1 transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
