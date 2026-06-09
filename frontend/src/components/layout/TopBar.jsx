import { useAuth } from '../../context/AuthContext';
import { formatSyncTime } from '../../utils/dateUtils';
import Logo from '../../assets/logo.svg?react';

export function TopBar({ fetchedAt }) {
  const { user, logout } = useAuth();
  const syncLabel = fetchedAt ? formatSyncTime(fetchedAt) : 'Loading data…';

  return (
    <div className="flex items-center justify-between px-7 py-2 bg-brand border-b border-brand-dark flex-wrap gap-2.5">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center w-12 h-12">
          <div className="absolute inset-0 bg-white rounded-full" />
          <Logo className="relative h-10 w-auto" />
        </div>
        <p className="text-[15px] text-white/70">{syncLabel}</p>
      </div>
      {user && (
        <div className="flex items-center gap-5">
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
