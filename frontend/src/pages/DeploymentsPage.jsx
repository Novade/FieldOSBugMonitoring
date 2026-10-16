import { RefreshCw } from 'lucide-react';
import { useDeployments } from '../hooks/useDeployments';
import { Card } from '../components/common/Card';
import { Banner } from '../components/common/Banner';
import { Spinner } from '../components/common/Spinner';
import { KpiTile } from '../components/common/KpiTile';
import { IconButton } from '../components/common/IconButton';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { ProjectDeployCard } from '../components/deployments/ProjectDeployCard';
import { MonthlyDeployTable } from '../components/deployments/MonthlyDeployTable';
import { GROUP_STYLES } from '../constants/deployments';
import { formatMonth, formatSyncTime } from '../utils/dateUtils';

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

  if (loading && !data) return <Spinner label="Syncing deployments from Azure DevOps…" />;

  const pipelines = data?.pipelines ?? [];
  const { groups = [], months = [], completeFrom = null } = data?.monthly ?? {};
  const kpis = buildKpis(months);

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

          <Card
            accent="indigo"
            title="Deployment frequency"
            subtitle="Successful production deploys per month (DORA) — click a legend item to hide a project"
            className="mb-4"
          >
            <StackedBarChart
              id="cDeployFrequency"
              labels={months.map((m) => formatMonth(m.month))}
              series={groups.map((g) => ({
                label: g,
                data: months.map((m) => m.prod[g] || 0),
                color: GROUP_STYLES[g]?.color ?? '#4a6280',
              }))}
              maxRotation={0}
              showTotals
            />
          </Card>

          <Card
            accent="slate"
            title="Monthly breakdown"
            subtitle="Successful production deploys per project, with staging totals for reference"
          >
            <MonthlyDeployTable groups={groups} months={months} completeFrom={completeFrom} />
          </Card>
        </>
      )}
    </div>
  );
}
