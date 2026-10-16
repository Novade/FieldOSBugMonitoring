import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useDeployments } from '../hooks/useDeployments';
import { Card } from '../components/common/Card';
import { Banner } from '../components/common/Banner';
import { Spinner } from '../components/common/Spinner';
import { KpiTile } from '../components/common/KpiTile';
import { IconButton } from '../components/common/IconButton';
import { ProjectDeployCard } from '../components/deployments/ProjectDeployCard';
import { MonthlyDeployTable } from '../components/deployments/MonthlyDeployTable';
import { formatSyncTime } from '../utils/dateUtils';

// Prod deploys this month, last month and the average of the 3 months before this one.
function buildKpis(months) {
  const [current, ...previous] = [...months].reverse();
  const lastThree = previous.slice(0, 3);
  const avg = lastThree.length
    ? (lastThree.reduce((sum, m) => sum + m.prodTotal, 0) / lastThree.length).toFixed(1)
    : '—';
  return {
    thisMonth: current?.prodTotal ?? 0,
    lastMonth: previous[0]?.prodTotal ?? '—',
    avg,
    stagingThisMonth: current?.stagingTotal ?? 0,
  };
}

export function DeploymentsPage() {
  const { data, loading, error, refresh } = useDeployments();
  const [selectedYear, setSelectedYear] = useState('');

  if (loading && !data) return <Spinner label="Syncing deployments from Azure DevOps…" />;

  const pipelines = data?.pipelines ?? [];
  const { groups = [], months = [] } = data?.monthly ?? {};
  const kpis = buildKpis(months);
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))].reverse();
  const yearMonths = months.filter((m) => m.month.startsWith(`${selectedYear}-`));

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      <div className="flex items-center gap-2 mb-3">
        {data?.syncedAt && <p className="text-[13px] text-[#8896b0]">{formatSyncTime(data.syncedAt)}</p>}
        <IconButton icon={RefreshCw} label="Sync now" onClick={refresh} disabled={loading} spinning={loading} />
      </div>
      <Banner message={error} visible={!!error} />

      {data && (
        <>
          <div className="flex gap-3 mb-5">
            <KpiTile label="Prod deploys this month" value={kpis.thisMonth} accent="#2e7d5e" />
            <KpiTile label="Prod deploys last month" value={kpis.lastMonth} accent="#3b6cb7" />
            <KpiTile label="Prod avg / month (prev 3)" value={kpis.avg} accent="#5c4fa3" />
            <KpiTile label="Staging deploys this month" value={kpis.stagingThisMonth} accent="#e67e22" />
          </div>

          <div className="grid grid-cols-2 max-[800px]:grid-cols-1 gap-4 mb-4">
            {groups.map((group) => (
              <ProjectDeployCard
                key={group}
                group={group}
                pipelines={pipelines.filter((p) => p.group === group)}
              />
            ))}
          </div>

          <div className="flex justify-end mb-4">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="text-[13px] border border-[#dde2ea] rounded-lg px-3 py-2 bg-white text-[#1a2332] cursor-pointer"
            >
              <option value="" disabled>Select year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Card
            accent="slate"
            title="Monthly breakdown"
            subtitle={
              selectedYear
                ? `${selectedYear} — successful production deploys per project, with staging totals for reference`
                : 'Select a year to see successful deploys per month'
            }
          >
            {selectedYear && (
              <MonthlyDeployTable groups={groups} months={yearMonths} />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
