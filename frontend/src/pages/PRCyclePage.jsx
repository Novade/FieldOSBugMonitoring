import { Fragment, useState } from 'react';
import { useGitHubData } from '../hooks/useGitHubData';
import { PRKpiStrip } from '../components/pr/PRKpiStrip';
import { PRTrendChart } from '../components/pr/PRTrendChart';
import { PRRepoBarChart } from '../components/pr/PRRepoBarChart';
import { PROpenPrsTab } from '../components/pr/PROpenPrsTab';
import { PRLoadingState } from '../components/pr/PRLoadingState';
import { FailedRepoNotice } from '../components/pr/FailedRepoNotice';
import { Card } from '../components/common/Card';
import { Banner } from '../components/common/Banner';
import { formatSyncTime } from '../utils/dateUtils';

const LEGEND_ITEMS = [
  { color: '#c0392b', label: 'Breaching' },
  { color: '#d97706', label: 'Close' },
  { color: '#2e7d5e', label: 'Compliant' },
];

// Each row pairs the per-repo breakdown (left) with the weekly trend (right)
// for one metric, so you can see "who's slow" and "is it getting better or
// worse" side by side.
const METRICS = [
  {
    key: 'cycleTime_p75',
    label: 'Cycle Time',
    accent: 'blue',
    color: '#3b6cb7',
    unit: 'h',
    decimals: 1,
    breaching: 24,
    close: 18,
  },
  {
    key: 'firstReview_p75',
    label: 'First Review',
    accent: 'teal',
    color: '#2e7d5e',
    unit: 'h',
    decimals: 1,
    breaching: 4,
    close: 3,
  },
  {
    key: 'prSize_p75',
    label: 'PR Size',
    accent: 'amber',
    color: '#d97706',
    unit: '',
    decimals: 0,
    breaching: 200,
    close: null,
  },
];

export function PRCyclePage() {
  const { summary, repos, openPrs, loading, error, progress, fetchedAt, failedRepos, retryingRepos, retry } =
    useGitHubData();
  const [selectedRepo, setSelectedRepo] = useState('all');

  if (loading && !summary) return <PRLoadingState progress={progress} />;

  const activeTrend =
    selectedRepo === 'all' ? summary?.weeklyTrend?.all : summary?.weeklyTrend?.byRepo?.[selectedRepo];
  const trendScopeLabel = selectedRepo === 'all' ? '' : ` — ${selectedRepo}`;

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      {fetchedAt && (
        <p className="text-[13px] text-[#8896b0] mb-3">{formatSyncTime(fetchedAt)}</p>
      )}
      {error && <Banner message={error} className="mb-5" />}
      <FailedRepoNotice failedRepos={failedRepos} retryingRepos={retryingRepos} onRetry={retry} />

      <PRKpiStrip summary={summary} />

      <div className="flex justify-end mb-4">
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="text-[13px] border border-[#dde2ea] rounded-lg px-3 py-2 bg-white text-[#1a2332] cursor-pointer"
        >
          <option value="all">All Repos</option>
          {(repos?.repos || []).map((r) => (
            <option key={r.repo} value={r.repo}>
              {r.repo}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 max-[800px]:grid-cols-1 gap-4 mb-4">
        {METRICS.map((m) => (
          <Fragment key={m.key}>
            <Card
              accent={m.accent}
              title={`${m.label} - By Repo (P75)`}
              subtitle={`Last 30 days — dashed line = ${m.breaching}${m.unit} target`}
            >
              <PRRepoBarChart
                repos={repos?.repos}
                metricKey={m.key}
                axisLabel={m.unit === 'h' ? 'Hours' : 'Lines'}
                unit={m.unit}
                decimals={m.decimals}
                breaching={m.breaching}
                close={m.close}
                chartId={`prRepo_${m.key}`}
              />
            </Card>
            <Card
              accent={m.accent}
              title={`${m.label} - Weekly (P75)${trendScopeLabel}`}
              subtitle={`Last 30 days vs ${m.breaching}${m.unit} target`}
            >
              <PRTrendChart
                weeklyTrend={activeTrend}
                metricKey={m.key}
                label={m.label}
                axisLabel={m.unit === 'h' ? 'Hours' : 'Lines'}
                color={m.color}
                unit={m.unit}
                decimals={m.decimals}
                target={m.breaching}
                chartId={`prTrend_${m.key}`}
              />
            </Card>
          </Fragment>
        ))}
      </div>

      <div className="flex gap-4 justify-end mb-5">
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[12px] text-[#6b7a99]">
            <span className="inline-block w-3 h-3 rounded-[2px]" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
      </div>

      <PROpenPrsTab openPrs={openPrs?.openPRs} />
    </div>
  );
}
