import { useState } from 'react';
import { useGitHubData } from '../hooks/useGitHubData';
import { PRKpiStrip } from '../components/pr/PRKpiStrip';
import { PRTrendChart } from '../components/pr/PRTrendChart';
import { PRTabBar } from '../components/pr/PRTabBar';
import { PRByRepoTab } from '../components/pr/PRByRepoTab';
import { PROpenPrsTab } from '../components/pr/PROpenPrsTab';
import { PRLoadingState } from '../components/pr/PRLoadingState';
import { Card } from '../components/common/Card';
import { Banner } from '../components/common/Banner';
import { formatSyncTime } from '../utils/dateUtils';

export function PRCyclePage() {
  const { summary, repos, openPrs, loading, error, progress, fetchedAt } = useGitHubData();
  const [activeTab, setActiveTab] = useState('by-repo');

  if (loading && !summary) return <PRLoadingState progress={progress} />;

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      {fetchedAt && (
        <p className="text-[13px] text-[#8896b0] mb-3">{formatSyncTime(fetchedAt)}</p>
      )}
      {error && <Banner message={error} className="mb-5" />}

      <PRKpiStrip summary={summary} />

      <Card accent="blue" title="Weekly P75 Cycle Time" subtitle="Rolling 8 weeks vs 24h target" className="mb-5">
        <PRTrendChart weeklyTrend={summary?.weeklyTrend} />
      </Card>

      <PRTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'by-repo' && <PRByRepoTab repos={repos?.repos} />}
      {activeTab === 'open-prs' && <PROpenPrsTab openPrs={openPrs?.openPRs} />}
    </div>
  );
}
