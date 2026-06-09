import { useMemo } from 'react';
import { Card } from '../common/Card';
import { KpiCard } from '../kpi/KpiCard';
import { WeeklyPriorityChart } from '../charts/WeeklyPriorityChart';
import { isOpen, isDeploy, isResolved } from '../../utils/issueUtils';

export function RegressionDashboard({ issues, onDrillTo }) {
  const kpis = useMemo(() => {
    const total = issues.length;
    const resolved = issues.filter(isResolved).length;
    const net = issues.filter(isOpen).length;
    const deploy = issues.filter(isDeploy).length;
    const blocked = issues.filter((b) => b.st === 'Blocked').length;
    return { total, resolved, net, deploy, blocked };
  }, [issues]);

  return (
    <div>
      <div className="flex flex-wrap gap-2.5 justify-center mb-5">
        <KpiCard
          type="created" group="primary" label="Total created"
          value={kpis.total} sub="Created from Jan 1, 2026"
          onClick={() => onDrillTo('all', '', 'All regression bugs')}
        />
        <KpiCard
          type="resolved" group="primary" label="Total resolved"
          value={kpis.resolved} sub="With resolution date"
          onClick={() => onDrillTo('resolved', true, 'Resolved regression bugs')}
        />
        <div className="basis-full h-0" />
        <KpiCard
          type="open" group="secondary" label="Net open"
          value={kpis.net}
          sub={kpis.net > 0 ? `${kpis.net} bugs still open` : 'All clear'}
          warn={kpis.net > 0}
          showTooltip
          onClick={() => onDrillTo('open', true, 'Open regression bugs')}
        />
        <KpiCard
          type="deploy" group="secondary" label="For Deployment & Testing"
          value={kpis.deploy}
          sub={kpis.deploy > 0 ? 'Awaiting release' : 'None pending'}
          onClick={() => onDrillTo('deploy', true, 'For deployment & testing')}
        />
        <KpiCard
          type="blocked" group="secondary" label="Blocked"
          value={kpis.blocked}
          sub={kpis.blocked > 0 ? 'Needs attention' : 'None blocked'}
          warn={kpis.blocked > 0}
          onClick={() => onDrillTo('blocked', true, 'Blocked regression bugs')}
        />
      </div>

      <Card accent="indigo" title="Weekly regression creation by priority" subtitle="Regression bugs created each week, broken down by severity — click a point to view that week's issues" className="mb-4">
        <WeeklyPriorityChart issues={issues} onDrillTo={onDrillTo} />
      </Card>
    </div>
  );
}
