import { useMemo } from 'react';
import { KpiCard } from './KpiCard';
import {
  isOpen,
  isDeploy,
  isDeployed,
  needsDeployment,
  hasNoActionDoneLabel,
} from '../../utils/issueUtils';

export function KpiRow({ issues, onDrillTo }) {
  const kpis = useMemo(() => {
    const total = issues.length;
    const noActionDone = issues.filter(hasNoActionDoneLabel).length;
    const validCreated = issues.length - noActionDone;
    const deployed = issues.filter(isDeployed).length;
    const net = issues.filter((b) => isOpen(b) && b.st !== 'Blocked').length;
    const deploy = issues.filter(isDeploy).length;
    const pendingDeployment = issues.filter(needsDeployment).length;
    const blocked = issues.filter((b) => b.st === 'Blocked').length;
    return {
      total,
      validCreated,
      noActionDone,
      deployed,
      net,
      deploy,
      pendingDeployment,
      blocked,
    };
  }, [issues]);

  return (
    <div className="mb-5">
      <div className="flex flex-wrap gap-2.5 justify-center mb-2.5">
        <KpiCard
          type="created"
          group="primary"
          label="Total bugs created"
          value={kpis.total}
          sub="Created from Jan 1, 2026"
          onClick={() => onDrillTo('all', '', 'All bugs')}
        />
        <KpiCard
          type="createdValid"
          group="primary"
          label="Total created (valid)"
          value={kpis.validCreated}
          sub={`Excludes No Action Done (${kpis.noActionDone})`}
          onClick={() => onDrillTo('created_valid', true, 'Created (valid)')}
        />
        <KpiCard
          type="deployed"
          group="primary"
          label="Total deployed"
          value={kpis.deployed}
          sub="Shipped to prod"
          onClick={() => onDrillTo('deployed', true, 'Deployed bugs')}
        />
      </div>
      <div className="flex flex-wrap gap-2.5 justify-center">
        <KpiCard
          type="open"
          group="secondary"
          label="Net open"
          value={kpis.net}
          sub={kpis.net > 0 ? `${kpis.net} bugs still open` : 'All clear'}
          warn={kpis.net > 0}
          showTooltip
          tooltipLabel="Open, excluding Blocked"
          tooltipContent="Bugs with status: To Do, In Progress, Code Review, or Failed."
          onClick={() =>
            onDrillTo('open_excl_blocked', true, 'Open bugs (excl. blocked)')
          }
        />
        <KpiCard
          type="deploy"
          group="secondary"
          label="For Testing"
          value={kpis.deploy}
          sub={kpis.deploy > 0 ? 'For testing' : 'None pending'}
          onClick={() => onDrillTo('deploy', true, 'For deployment & testing')}
        />
        <KpiCard
          type="pendingDeployment"
          group="secondary"
          label="Validated, pending deployment"
          labelLines={['Validated,', 'pending deployment']}
          value={kpis.pendingDeployment}
          sub={
            kpis.pendingDeployment > 0
              ? 'Done, awaiting prod deployment'
              : 'None pending'
          }
          onClick={() =>
            onDrillTo(
              'pending_deployment',
              true,
              'Validated, pending deployment'
            )
          }
        />
        <KpiCard
          type="blocked"
          group="secondary"
          label="Blocked"
          value={kpis.blocked}
          sub={kpis.blocked > 0 ? 'Needs attention' : 'None blocked'}
          warn={kpis.blocked > 0}
          onClick={() => onDrillTo('blocked', true, 'Blocked bugs')}
        />
      </div>
    </div>
  );
}
