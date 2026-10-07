import { useMemo, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import { Card } from '../common/Card';
import { Spinner } from '../common/Spinner';
import { Banner } from '../common/Banner';
import { HoverLabel } from '../common/HoverLabel';
import { StatusPill, PriorityPill } from '../common/Pill';
import { PSORT } from '../../constants/jira';
import { JIRA_BASE, SCOPE_LABELS, SOURCE_PILL } from '../../constants/escapeRate';
import { td, th, thSortable } from './styles';

function SourcePill({ src }) {
  const pill = SOURCE_PILL[src];
  if (!pill) return null;
  return (
    <span className={`inline-block px-[9px] py-[2px] rounded-[20px] text-[11px] font-semibold whitespace-nowrap ${pill.className}`}>
      {pill.label}
    </span>
  );
}

export function EscapeRateIssuesTable({ entry, scope, issues, loading, error }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(0);

  function toggleSort(col) {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir(1);
    } else if (sortDir === 1) {
      setSortDir(-1);
    } else {
      setSortCol(null);
      setSortDir(0);
    }
  }

  function thClass(col) {
    if (sortCol !== col) return thSortable;
    return `${thSortable} text-brand${sortDir === 1 ? " after:content-['_↑']" : " after:content-['_↓']"}`;
  }

  const displayed = useMemo(() => {
    if (!sortCol) return issues;
    return [...issues].sort((a, b) => {
      if (sortCol === 'p') {
        const va = PSORT[a.p] ?? 99;
        const vb = PSORT[b.p] ?? 99;
        return sortDir === 1 ? va - vb : vb - va;
      }
      const va = (sortCol === 'epic' ? a.epic?.s : a[sortCol]) || '';
      const vb = (sortCol === 'epic' ? b.epic?.s : b[sortCol]) || '';
      return sortDir === 1 ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [issues, sortCol, sortDir]);

  const showSource = scope === 'total';
  const showEpic = scope === 'test';
  const title = entry ? `${entry.version} — ${SCOPE_LABELS[scope]}` : 'Bugs';
  const subtitle = entry
    ? loading
      ? 'Loading from Jira…'
      : `Showing ${issues.length} issues · live from Jira (may differ from the saved count if labels changed — use Recompute)`
    : 'Click a number in the Escape Rate table to see its bugs.';

  function openIssue(key) {
    window.open(`${JIRA_BASE}/${key}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <Card accent="slate" title={title} subtitle={subtitle}>
      {!entry && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-[13px] text-[#8896b0] border border-dashed border-[#dde2ea] rounded-lg">
          <MousePointerClick size={22} />
          No version selected
        </div>
      )}
      {entry && loading && <Spinner height={160} />}
      {entry && !loading && error && <Banner message={error} visible />}
      {entry && !loading && !error && (
        <div className="border border-[#dde2ea] rounded-lg overflow-hidden">
          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className={th}>Key</th>
                  <th className={th}>Summary</th>
                  {showSource && <th onClick={() => toggleSort('src')} className={thClass('src')}>Source</th>}
                  <th onClick={() => toggleSort('st')} className={thClass('st')}>Status</th>
                  <th onClick={() => toggleSort('p')} className={thClass('p')}>Priority</th>
                  {showEpic && <th onClick={() => toggleSort('epic')} className={thClass('epic')}>Epic</th>}
                  <th onClick={() => toggleSort('c')} className={thClass('c')}>Created</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((b) => (
                  <tr
                    key={b.k}
                    onClick={() => openIssue(b.k)}
                    onKeyDown={(e) => e.key === 'Enter' && openIssue(b.k)}
                    tabIndex={0}
                    className="cursor-pointer hover:bg-[#f8faff] focus:outline-none focus:bg-[#f8faff]"
                  >
                    <td className={`${td} text-brand font-semibold font-mono text-[11.5px] whitespace-nowrap`}>
                      <HoverLabel label="Open in Jira">{b.k}</HoverLabel>
                    </td>
                    <td className={`${td} max-w-[260px] truncate`}>
                      <HoverLabel as="div" className="truncate" label={b.s}>{b.s}</HoverLabel>
                    </td>
                    {showSource && <td className={td}><SourcePill src={b.src} /></td>}
                    <td className={td}><StatusPill status={b.st} /></td>
                    <td className={td}><PriorityPill priority={b.p} /></td>
                    {showEpic && (
                      <td className={`${td} max-w-[260px] truncate text-[12px] text-[#5a6075]`}>
                        <HoverLabel as="div" className="truncate" label={b.epic ? `${b.epic.k} · ${b.epic.s}` : 'No epic'}>
                          {b.epic ? b.epic.s : '-'}
                        </HoverLabel>
                      </td>
                    )}
                    <td className={`${td} whitespace-nowrap text-[12px] text-[#9aa0b4]`}>{b.c || '-'}</td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={5 + (showSource ? 1 : 0) + (showEpic ? 1 : 0)} className="px-3.5 py-8 text-center text-[13px] text-[#8896b0]">
                      No bugs found for this range.
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
