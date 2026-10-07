import { useLayoutEffect, useRef, useState } from 'react';
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Spinner } from '../common/Spinner';
import { HoverLabel } from '../common/HoverLabel';
import { btnPrimary, td, th } from './styles';

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
          active ? 'bg-[#eef2fb] text-brand ring-1 ring-brand' : 'text-brand hover:bg-[#eef2fb] hover:underline'
        }`}
      >
        {value}
      </button>
    </HoverLabel>
  );
}

function IconButton({ icon: Icon, label, onClick, disabled, spinning, danger }) {
  return (
    <HoverLabel label={label} className="inline-flex">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`p-1.5 rounded-md text-[#8896b0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
          danger ? 'hover:bg-[#fdecea] hover:text-[#c0392b]' : 'hover:bg-[#eef2fb] hover:text-brand'
        }`}
      >
        <Icon size={15} className={spinning ? 'animate-spin' : ''} />
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
    setMaxHeight((head?.offsetHeight ?? 0) + rowsHeight);
  }, [rowCount, loading]);

  return { scrollRef, maxHeight };
}

export function EscapeRateTable({ entries, loading, selection, recomputingId, onNew, onSelect, onEdit, onRecompute, onRecomputeAll, onDelete }) {
  const { scrollRef, maxHeight } = useMaxRowsHeight(entries.length, loading);

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
        <div className="border border-[#dde2ea] rounded-lg overflow-hidden">
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
                    <tr key={e.id} className={selection?.id === e.id ? 'bg-[#f8faff]' : 'hover:bg-[#f8faff]'}>
                      <td className={`${td} font-semibold text-[#1a2332]`}>{e.version}</td>
                      <td className={`${td} text-[12px] text-[#5a6075] whitespace-nowrap tabular-nums`}>
                        <div><span className="inline-block w-[52px] text-[#9aa0b4]">Staging</span>{shortDate(e.testFrom)} → {shortDate(e.testTo)}</div>
                        <div><span className="inline-block w-[52px] text-[#9aa0b4]">Prod</span>{shortDate(e.prodFrom)} → {shortDate(e.prodTo)}</div>
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
                      <td className={`${td} text-right font-semibold text-[#1a2332] tabular-nums`}>
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
                    <td colSpan={7} className="px-3.5 py-8 text-center text-[13px] text-[#8896b0]">
                      No entries yet. Click New to add a version.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
