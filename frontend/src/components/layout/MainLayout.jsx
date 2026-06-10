import { useState, createContext } from 'react';
import { TopBar } from './TopBar';
import { LeftPane } from './LeftPane';

export const SyncTimeContext = createContext(null);

export function MainLayout({ children }) {
  const [fetchedAt, setFetchedAt] = useState(null);

  return (
    <SyncTimeContext.Provider value={setFetchedAt}>
      <div
        className="flex flex-col h-screen"
        style={{
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 14,
          lineHeight: 1.5,
        }}
      >
        <TopBar fetchedAt={fetchedAt} />
        <div className="flex flex-1 overflow-hidden">
          <LeftPane />
          <div className="flex-1 overflow-y-auto bg-[#f0f2f5]">
            {children}
          </div>
        </div>
      </div>
    </SyncTimeContext.Provider>
  );
}
