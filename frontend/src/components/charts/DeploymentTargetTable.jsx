import { useMemo } from 'react';
import {
  PORDER,
  PC,
  DEPLOY_TARGETS,
  DEPLOY_TARGET_LABELS,
} from '../../constants/jira';
import { med, workingDays } from '../../utils/dateUtils';

export function DeploymentTargetTable({ issues }) {
  const rows = useMemo(() => {
    const dm = {};
    PORDER.forEach((p) => (dm[p] = []));
    issues
      .filter((b) => b.d && b.c)
      .forEach((b) => {
        const days = workingDays(b.c, b.d);
        if (!isNaN(days) && dm[b.p]) dm[b.p].push(days);
      });
    return PORDER.map((p) => {
      const m = med(dm[p]);
      const v = m === null ? null : +m.toFixed(1);
      const onTrack = v !== null && v <= DEPLOY_TARGETS[p];
      const valStr =
        v === null
          ? 'No data'
          : v < 1
          ? '< 1 day'
          : v === 1
          ? '1 day'
          : v < 30
          ? `${v} days`
          : `${Math.round(v / 30)}mo ${Math.round(v % 30)}d`;
      return { p, v, onTrack, valStr, target: DEPLOY_TARGET_LABELS[p] };
    });
  }, [issues]);

  return (
    <table className="w-full border-collapse text-[13px] mt-1">
      <thead>
        <tr>
          {['Priority', 'Median', 'Target', 'Status'].map((h, i) => (
            <th
              key={h}
              className={`py-[7px] px-[10px] text-[10px] font-semibold text-ink-subtle bg-canvas border-b border-line uppercase tracking-[.4px] ${
                i === 0 ? 'text-left' : i === 3 ? 'text-center' : 'text-right'
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(({ p, v, onTrack, valStr, target }, idx) => (
          <tr key={p}>
            <td
              className={`py-[6px] px-[8px] ${
                idx < rows.length - 1 ? 'border-b border-line-soft' : ''
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-sm mr-1.5"
                style={{ background: PC[p] }}
              />
              {p}
            </td>
            <td
              className={`py-[6px] px-[8px] text-right text-ink ${
                idx < rows.length - 1 ? 'border-b border-line-soft' : ''
              }`}
            >
              {valStr}
            </td>
            <td
              className={`py-[6px] px-[8px] text-right text-ink-subtle ${
                idx < rows.length - 1 ? 'border-b border-line-soft' : ''
              }`}
            >
              {target}
            </td>
            <td
              className={`py-[6px] px-[8px] text-center ${
                idx < rows.length - 1 ? 'border-b border-line-soft' : ''
              }`}
            >
              {v === null ? (
                <span className="text-[10px] text-ink-subtle">—</span>
              ) : onTrack ? (
                <span className="bg-success-tint text-success-ink px-[7px] py-[1px] rounded-[10px] text-[10px] font-medium">
                  ✓ On track
                </span>
              ) : (
                <span className="bg-danger-tint text-danger-ink px-[7px] py-[1px] rounded-[10px] text-[10px] font-medium">
                  ✕ Over
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
