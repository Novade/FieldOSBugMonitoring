import { useMemo } from 'react';
import { formatHoursShort } from '../../utils/dateUtils';

const TARGETS = {
  cycleTime: 24,
  firstReview: 4,
  prSize: 200,
};

function PRStatCard({ label, value, sub, warn }) {
  const isBreaching = warn === true;
  const valueColor = warn
    ? 'text-danger'
    : warn === false
    ? 'text-success'
    : 'text-ink';

  const borderColor =
    isBreaching ? 'border-[#c0392b]' : 'border-line';

  return (
    <div
      className={`relative bg-surface rounded-lg border px-4 py-[14px] flex-1 min-w-[180px] max-w-[260px]
        before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-lg
        ${isBreaching ? 'before:bg-[#c0392b]' : 'before:bg-[#3b6cb7]'}
        ${borderColor}`}
    >
      <div className="text-[12px] font-semibold uppercase tracking-[.5px] mb-3 text-ink-muted">
        {label}
      </div>
      <div className={`text-[25px] font-bold ${valueColor}`}>{value ?? '—'}</div>
      {sub && <div className="text-[11px] text-ink-subtle mt-3">{sub}</div>}
    </div>
  );
}

export function PRKpiStrip({ summary }) {
  const cards = useMemo(() => {
    if (!summary) return null;
    const cycleP75 = summary.cycleTime?.p75;
    const reviewP75 = summary.firstReview?.p75;
    const sizeP75 = summary.prSize?.p75;

    return [
      {
        label: 'Cycle Time (P75)',
        value: formatHoursShort(cycleP75),
        sub: `Target < ${TARGETS.cycleTime}h`,
        warn: cycleP75 != null ? cycleP75 > TARGETS.cycleTime : undefined,
      },
      {
        label: 'First Review (P75)',
        value: formatHoursShort(reviewP75),
        sub: `Target < ${TARGETS.firstReview}h`,
        warn: reviewP75 != null ? reviewP75 > TARGETS.firstReview : undefined,
      },
      {
        label: 'PR Size (P75)',
        value: sizeP75 != null ? `${sizeP75} lines` : '—',
        sub: `Target ≤ ${TARGETS.prSize} lines`,
        warn: sizeP75 != null ? sizeP75 > TARGETS.prSize : undefined,
      },
    ];
  }, [summary]);

  if (!cards) {
    return (
      <div className="flex flex-wrap gap-2.5 justify-center mb-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 min-w-[180px] max-w-[260px] h-[110px] bg-canvas-alt rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2.5 justify-center mb-5">
      {cards.map((card) => (
        <PRStatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
