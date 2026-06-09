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
import { CumulativeCreatedVsResolvedChart } from '../charts/CumulativeCreatedVsResolvedChart';

export function BugsDashboard({ issues, onDrillTo }) {
  return (
    <div>
      <KpiRow issues={issues} onDrillTo={onDrillTo} />

      <Card accent="coral" title="Assignee workload" subtitle="Open bugs per person by priority — spot who is overloaded" className="mb-4">
        <AssigneeWorkloadChart issues={issues} onDrillTo={onDrillTo} />
      </Card>

      <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 mb-4">
        <Card accent="blue" title="Bugs by priority" subtitle="Created (Jan 2026+) vs resolved (Jan 2026+) by severity">
          <PriorityChart issues={issues} onDrillTo={onDrillTo} />
        </Card>
        <Card accent="amber" title="Bug age breakdown" subtitle="Currently open bugs grouped by how long they have been unresolved — longer = higher risk">
          <BugAgeChart issues={issues} onDrillTo={onDrillTo} />
        </Card>
      </div>

      <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 mb-4">
        <Card accent="teal" title="Median deployment time (days)" subtitle="Creation to deployment in working days (excl. weekends) · dashed line shows target">
          <DeploymentTimeChart issues={issues} />
        </Card>
        <Card accent="teal" title="Deployment target status" subtitle="Median working days vs SLA target">
          <DeploymentTargetTable issues={issues} />
        </Card>
      </div>

      <Card accent="indigo" title="Weekly bug creation by priority" subtitle="Bugs created each week by severity — click a point to view that week's issues" className="mb-4">
        <WeeklyPriorityChart issues={issues} onDrillTo={onDrillTo} />
      </Card>

      <Card accent="purple" title="Cumulative created bugs by priority band" subtitle="Running totals — each line includes all priorities above it" className="mb-4">
        <CumulativeBandChart issues={issues} />
      </Card>

      <Card accent="slate" title="Weekly created vs resolved" subtitle="All bugs resolved in 2026 vs created in 2026, per week" className="mb-4">
        <WeeklyCreatedVsResolvedChart issues={issues} onDrillTo={onDrillTo} />
      </Card>

      <Card accent="slate" title="Cumulative created vs resolved" subtitle="Gap = active backlog. When lines meet, team is clear" className="mb-4">
        <CumulativeCreatedVsResolvedChart issues={issues} onDrillTo={onDrillTo} />
      </Card>
    </div>
  );
}
