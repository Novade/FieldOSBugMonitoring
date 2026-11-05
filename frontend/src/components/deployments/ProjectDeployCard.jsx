import { Card } from '../common/Card';
import { HoverLabel } from '../common/HoverLabel';
import { RESULT_STATES, StateIcon } from '../common/StateIcon';
import { formatRelative } from '../../utils/dateUtils';
import { ENV_LABELS, GROUP_ACCENTS } from '../../constants/deployments';

const absoluteDate = (iso) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

// Failed runs are red; canceled or partially succeeded runs are amber
const UNSUCCESSFUL = {
  failed: { text: 'failed', state: RESULT_STATES.failed },
  canceled: { text: 'was canceled', state: RESULT_STATES.running },
  partiallySucceeded: { text: 'partially succeeded', state: RESULT_STATES.running },
};

function RunLink({ run, children }) {
  return (
    <a href={run.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
      {children}
    </a>
  );
}

function RunTime({ run }) {
  return (
    <HoverLabel label={absoluteDate(run.finishTime)} className="inline-flex">
      <span>{formatRelative(run.finishTime)}</span>
    </HoverLabel>
  );
}

function PipelineRow({ pipeline }) {
  const { lastSuccess, latest, notFound } = pipeline;
  const label = [pipeline.platform, ENV_LABELS[pipeline.env]].filter(Boolean).join(' ');
  // Shown when the most recent run didn't succeed, so a broken deploy stands out
  const failedAfter = latest && latest.result !== 'succeeded' ? latest : null;
  const outcome = failedAfter && (UNSUCCESSFUL[failedAfter.result] || { text: failedAfter.result, state: RESULT_STATES.failed });

  return (
    <tr className="border-t border-line-soft first:border-t-0">
      <td className="w-[140px] py-2.5 pr-3 text-ink-muted font-medium whitespace-nowrap align-top">{label}</td>
      <td className="py-2.5 text-[13px] text-ink">
        {notFound && (
          <span className="text-ink-subtle">Pipeline “{pipeline.name}” not found</span>
        )}
        {!notFound && !lastSuccess && <span className="text-ink-subtle">No successful runs yet</span>}
        {lastSuccess && (
          <div className="flex items-center gap-2 flex-wrap">
            <HoverLabel label="Last successful deploy" className="inline-flex">
              <StateIcon state={RESULT_STATES.passed} />
            </HoverLabel>
            <span className="font-semibold"><RunTime run={lastSuccess} /></span>
            <RunLink run={lastSuccess}>#{lastSuccess.buildNumber}</RunLink>
            <span className="text-[12px] text-ink-subtle font-mono">{lastSuccess.branch}</span>
          </div>
        )}
        {failedAfter && (
          <div className="flex items-center gap-2 mt-1 text-[12px]" style={{ color: outcome.state.color }}>
            <StateIcon state={outcome.state} />
            <span>
              Latest run {outcome.text} <RunTime run={failedAfter} /> ·{' '}
              <RunLink run={failedAfter}>#{failedAfter.buildNumber}</RunLink>
            </span>
          </div>
        )}
      </td>
    </tr>
  );
}

export function ProjectDeployCard({ group, pipelines }) {
  return (
    <Card accent={GROUP_ACCENTS[group]} title={group}>
      <table className="w-full border-collapse">
        <tbody>
          {pipelines.map((p) => (
            <PipelineRow key={p.name} pipeline={p} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
