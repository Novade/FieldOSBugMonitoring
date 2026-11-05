import { useLayoutEffect, useRef, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Spinner } from '../common/Spinner';
import { HoverLabel } from '../common/HoverLabel';
import { IconButton } from '../common/IconButton';
import { btnPrimary, td, th } from '../common/tableStyles';

function formatRate(rate) {
  return rate === null || rate === undefined ? '—' : `${rate.toFixed(1)}%`;
}

// Coverage dates drop the year when it's the current year (2026-09-22 → 09-22)
const CURRENT_YEAR = String(new Date().getFullYear());
function shortDate(date) {
  return date?.startsWith(`${CURRENT_YEAR}-`) ? date.slice(5) : date;
}

function CountButton({ value, active, onClick, title }) {
  return (
    <HoverLabel label={title} className="inline-flex">
      <button
        type="button"
        onClick={onClick}
        className={`min-w-[36px] px-2 py-0.5 rounded-md font-semibold tabular-nums transition-colors ${
          active ? 'bg-brand-tint text-brand ring-1 ring-brand' : 'text-brand hover:bg-brand-tint hover:underline'
        }`}
      >
        {value}
      </button>
    </HoverLabel>
  );
}

const MAX_VISIBLE_ROWS = 5;

// Caps the scroll area at the header plus MAX_VISIBLE_ROWS rows, measured from
// the rendered rows so it stays exact regardless of font or row content.
function useMaxRowsHeight(rowCount, loading) {
  const scrollRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(undefined);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const head = el.querySelector('thead');
    const rows = Array.from(el.querySelectorAll('tbody tr'));
    if (rows.length <= MAX_VISIBLE_ROWS) {
      setMaxHeight(undefined);
      return;
    }
    const rowsHeight = rows.slice(0, MAX_VISIBLE_ROWS).reduce((sum, r) => sum + r.offsetHeight, 0);
    const foot = el.querySelector('tfoot');
    setMaxHeight((head?.offsetHeight ?? 0) + rowsHeight + (foot?.offsetHeight ?? 0));
  }, [rowCount, loading]);

  return { scrollRef, maxHeight };
}

export function EscapeRateTable({ entries, loading, selection, recomputingId, onNew, onSelect, onEdit, onRecompute, onRecomputeAll, onDelete }) {
  const { scrollRef, maxHeight } = useMaxRowsHeight(entries.length, loading);
  // Pooled rate across versions: total after-prod ÷ total bugs (weighted by volume)
  const totals = entries.reduce(
    (t, e) => ({ test: t.test + (e.testCount || 0), prod: t.prod + (e.prodCount || 0) }),
    { test: 0, prod: 0 }
  );
  const totalBugs = totals.test + totals.prod;
  const totalRate = totalBugs ? (totals.prod / totalBugs) * 100 : null;
  const tf = `${td} bg-canvas border-t border-line font-semibold text-ink tabular-nums`;

  return (
    <Card
      title={
        <div className="flex items-center justify-between gap-3">
          <span>Bug Escape Rate</span>
          <button type="button" className={btnPrimary} onClick={onNew}>
            <Plus size={15} /> New
          </button>
        </div>
      }
      subtitle="Bugs after prod ÷ (bugs during testing + bugs after prod). Click a number to see its bugs."
    >
      {loading ? (
        <Spinner height={160} />
      ) : (
        <div className="border border-line rounded-lg overflow-hidden">
          <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight }}>
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={th}>Version</th>
                  <th className={th}>Coverage</th>
                  <th className={`${th} text-right`}>Bugs During Testing</th>
                  <th className={`${th} text-right`}>Bugs After Prod</th>
                  <th className={`${th} text-right`}>Total Bugs</th>
                  <th className={`${th} text-right`}>Escape Rate</th>
                  <th className={`${th} text-right`}>
                    {entries.length > 0 && (
                      <IconButton icon={RefreshCw} label="Recompute all from Jira" onClick={onRecomputeAll}
                        disabled={!!recomputingId} spinning={recomputingId === 'all'} />
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const isSelected = (scope) => selection?.id === e.id && selection.scope === scope;
                  const busy = recomputingId === e.id || recomputingId === 'all';
                  return (
                    <tr key={e.id} className={selection?.id === e.id ? 'bg-canvas' : 'hover:bg-canvas'}>
                      <td className={`${td} font-semibold text-ink`}>{e.version}</td>
                      <td className={`${td} text-[12px] text-ink-soft whitespace-nowrap tabular-nums`}>
                        <div><span className="inline-block w-[52px] text-ink-faint">Staging</span>{shortDate(e.testFrom)} → {shortDate(e.testTo)}</div>
                        <div><span className="inline-block w-[52px] text-ink-faint">Prod</span>{shortDate(e.prodFrom)} → {shortDate(e.prodTo)}</div>
                      </td>
                      <td className={`${td} text-right`}>
                        <CountButton value={e.testCount} active={isSelected('test')} onClick={() => onSelect(e, 'test')}
                          title="Show bugs during testing" />
                      </td>
                      <td className={`${td} text-right`}>
                        <CountButton value={e.prodCount} active={isSelected('prod')} onClick={() => onSelect(e, 'prod')}
                          title="Show bugs after prod" />
                      </td>
                      <td className={`${td} text-right`}>
                        <CountButton value={e.total} active={isSelected('total')} onClick={() => onSelect(e, 'total')}
                          title={`${e.testCount} during testing + ${e.prodCount} after prod`} />
                      </td>
                      <td className={`${td} text-right font-semibold text-ink tabular-nums`}>
                        <HoverLabel label={`Computed ${new Date(e.computedAt).toLocaleString()}`}>{formatRate(e.rate)}</HoverLabel>
                      </td>
                      <td className={`${td} whitespace-nowrap text-right`}>
                        <IconButton icon={Pencil} label="Edit" onClick={() => onEdit(e)} disabled={busy} />
                        <IconButton icon={RefreshCw} label="Recompute from Jira" onClick={() => onRecompute(e)} disabled={busy} spinning={busy} />
                        <IconButton icon={Trash2} label="Delete" onClick={() => onDelete(e)} disabled={busy} danger />
                      </td>
                    </tr>
                  );
                })}
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3.5 py-8 text-center text-[13px] text-ink-subtle">
                      No entries yet. Click New to add a version.
                    </td>
                  </tr>
                )}
              </tbody>
              {entries.length > 0 && (
                <tfoot className="sticky bottom-0 z-10">
                  <tr>
                    <td className={tf}>Total</td>
                    <td className={`${tf} text-[12px] font-normal text-ink-soft`}>
                      {entries.length} version{entries.length === 1 ? '' : 's'}
                    </td>
                    <td className={`${tf} text-right`}><span className="px-2">{totals.test}</span></td>
                    <td className={`${tf} text-right`}><span className="px-2">{totals.prod}</span></td>
                    <td className={`${tf} text-right`}><span className="px-2">{totalBugs}</span></td>
                    <td className={`${tf} text-right`}>
                      <HoverLabel label="Total bugs after prod ÷ total bugs, across all versions">{formatRate(totalRate)}</HoverLabel>
                    </td>
                    <td className={tf} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
