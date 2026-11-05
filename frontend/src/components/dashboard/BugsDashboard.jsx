import { useMemo } from 'react';
import { Card } from '../common/Card';
import { KpiRow } from '../kpi/KpiRow';
import { AssigneeWorkloadChart } from '../charts/AssigneeWorkloadChart';
import { PriorityChart } from '../charts/PriorityChart';
import { BugAgeChart } from '../charts/BugAgeChart';
import { DeploymentTimeChart } from '../charts/DeploymentTimeChart';
import { DeploymentTargetTable } from '../charts/DeploymentTargetTable';
import { WeeklyPriorityChart } from '../charts/WeeklyPriorityChart';
import { CumulativeBandChart } from '../charts/CumulativeBandChart';
import { WeeklyCreatedVsResolvedChart } from '../charts/WeeklyCreatedVsResolvedChart';
import { WeeklyCreatedVsDeployedChart } from '../charts/WeeklyCreatedVsDeployedChart';
import { CumulativeCreatedVsResolvedChart } from '../charts/CumulativeCreatedVsResolvedChart';
import { isQaBug } from '../../utils/issueUtils';

export function BugsDashboard({ issues, onDrillTo }) {
  // Dashboard is client-facing only: QA-BUG (found in staging) excluded everywhere
  const clientIssues = useMemo(() => issues.filter((b) => !isQaBug(b)), [issues]);
  const onClientDrillTo = (key, val, label) =>
    onDrillTo(key, val, `${label} (excl. QA-BUG)`, { excludeQa: true });

  return (
    <div>
      <div className="text-[12px] text-[#8896b0] text-center mb-3">
        Excludes QA-BUG (found in staging, not client-facing) — see Backlog for QA bugs
      </div>
      <KpiRow issues={clientIssues} onDrillTo={onClientDrillTo} />

      <Card accent="coral" title="Assignee workload" subtitle="Open bugs per person by priority — spot who is overloaded" className="mb-4">
        <AssigneeWorkloadChart issues={clientIssues} onDrillTo={onClientDrillTo} />
      </Card>

      <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 mb-4">
        <Card accent="blue" title="Bugs by priority" subtitle="Created (Jan 2026+) vs resolved (Jan 2026+) by severity">
          <PriorityChart issues={clientIssues} onDrillTo={onClientDrillTo} />
        </Card>
        <Card accent="amber" title="Bug age breakdown" subtitle="Currently open bugs grouped by how long they have been unresolved — longer = higher risk">
          <BugAgeChart issues={clientIssues} onDrillTo={onClientDrillTo} />
        </Card>
      </div>

      <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 mb-4">
        <Card accent="teal" title="Median deployment time (days)" subtitle="Creation to deployment in working days (excl. weekends) · dashed line shows target">
          <DeploymentTimeChart issues={clientIssues} />
        </Card>
        <Card accent="teal" title="Deployment target status" subtitle="Median working days vs SLA target">
          <DeploymentTargetTable issues={clientIssues} />
        </Card>
      </div>

      <Card accent="indigo" title="Weekly bug creation by priority" subtitle="Bugs created each week by severity — click a point to view that week's issues" className="mb-4">
        <WeeklyPriorityChart issues={clientIssues} onDrillTo={onClientDrillTo} />
      </Card>

      <Card accent="purple" title="Cumulative created bugs by priority band" subtitle="Running totals — each line includes all priorities above it" className="mb-4">
        <CumulativeBandChart issues={clientIssues} />
      </Card>

      <Card accent="slate" title="Weekly created vs resolved" subtitle="Bugs resolved in 2026 vs created in 2026, per week" className="mb-4">
        <WeeklyCreatedVsResolvedChart issues={clientIssues} onDrillTo={onClientDrillTo} />
      </Card>

      <Card accent="slate" title="Cumulative created vs resolved" subtitle="Gap = client-facing backlog. When lines meet, team is clear" className="mb-4">
        <CumulativeCreatedVsResolvedChart issues={clientIssues} onDrillTo={onClientDrillTo} />
      </Card>

      <Card accent="slate" title="Weekly created vs deployed" subtitle="Bugs created vs actually deployed to prod, per week (1-week buckets to surface hotfixes)" className="mb-4">
        <WeeklyCreatedVsDeployedChart issues={clientIssues} onDrillTo={onClientDrillTo} />
      </Card>
    </div>
  );
}
