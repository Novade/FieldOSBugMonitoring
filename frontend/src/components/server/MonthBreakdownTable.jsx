import { Card } from '../common/Card';
import { MONTH_LABELS, badgeClass, fmtDowntime } from '../../utils/serverUtils';

export function MonthBreakdownTable({ allMonths, selectedMonth, onSelectMonth, selectedYear }) {
  return (
    <Card accent="teal" title="Month Breakdown" subtitle={`${selectedYear} — all months`}>
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="text-[11px] text-ink-subtle uppercase">
            <th className="text-left pb-2 font-medium">Month</th>
            <th className="text-right pb-2 font-medium">Service Level</th>
            <th className="text-right pb-2 font-medium">Downtime</th>
            <th className="text-right pb-2 font-medium">Outages</th>
          </tr>
        </thead>
        <tbody>
          {allMonths.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-ink-subtle py-6 text-[13px]">No data available</td>
            </tr>
          ) : (
            allMonths.map((m) => {
              const isSelected = selectedMonth === m.month;
              const isClickable = !m.error;
              return (
                <tr
                  key={m.month}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : -1}
                  onClick={isClickable ? () => onSelectMonth(m.month) : undefined}
                  onKeyDown={(e) => {
                    if (!isClickable) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectMonth(m.month);
                    }
                  }}
                  className={`border-t border-line-soft transition-colors ${
                    isSelected ? 'bg-brand-tint' : isClickable ? 'cursor-pointer hover:bg-canvas' : ''
                  }`}
                >
                  <td className="py-2 text-ink-muted">
                    <span className="flex items-center gap-1.5">
                      {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#3b6cb7]" />}
                      {MONTH_LABELS[m.month - 1]}
                    </span>
                  </td>
                  <td className="text-right py-2">
                    {m.error ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${badgeClass(m.avgServiceLevel)}`}>
                        {m.avgServiceLevel?.toFixed(3)}%
                      </span>
                    )}
                  </td>
                  <td className="text-right py-2 font-mono text-[12px] text-ink-muted">
                    {m.error ? '—' : fmtDowntime(m.totalDowntime)}
                  </td>
                  <td className="text-right py-2 font-mono text-[12px] text-ink-muted">
                    {m.error ? '—' : m.totalOutages}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </Card>
  );
}
