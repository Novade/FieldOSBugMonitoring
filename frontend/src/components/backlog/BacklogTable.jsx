import { useEffect, useMemo, useState } from 'react';
import { StatusPill, PriorityPill } from '../common/Pill';
import { DrillBadge } from './DrillBadge';
import { FilterBar } from './FilterBar';
import { isOpen, isDeploy, isResolved, isDeployed, hasNoActionDoneLabel, needsDeployment } from '../../utils/issueUtils';
import { ws } from '../../utils/dateUtils';
import { PSORT } from '../../constants/jira';

const JIRA_BASE = 'https://novade.atlassian.net/browse';

const INITIAL_FILTERS = { search: '', priority: [], status: [], assignee: [], reg: [], os: [], noActionDone: false, pendingDeployment: false };

function drillToFilterField(drill) {
  if (!drill) return null;
  if (drill.key === 'p') return { field: 'priority', value: drill.val };
  if (drill.key === 'assignee_open')
    return { field: 'assignee', value: drill.val };
  if (drill.key === 'blocked') return { field: 'status', value: 'Blocked' };
  return null;
}

function applyDrill(data, drill) {
  if (!drill) return data;
  const today = new Date();
  switch (drill.key) {
    case 'p':
      return data.filter((b) => b.p === drill.val);
    case 'resolved':
      return data.filter(isResolved);
    case 'open':
      return data.filter(isOpen);
    case 'open_excl_blocked':
      return data.filter((b) => isOpen(b) && b.st !== 'Blocked');
    case 'blocked':
      return data.filter((b) => b.st === 'Blocked');
    case 'deploy':
      return data.filter(isDeploy);
    case 'pending_deployment':
      return data.filter(needsDeployment);
    case 'deployed':
      return data.filter(isDeployed);
    case 'created_valid':
      return data.filter((b) => !hasNoActionDoneLabel(b));
    case 'all':
      return data;
    case 'week_c':
      return data.filter((b) => ws(b.c) === drill.val);
    case 'week_c_valid':
      return data.filter((b) => ws(b.c) === drill.val && !hasNoActionDoneLabel(b));
    case 'week_r':
      return data.filter((b) => b.r && ws(b.r) === drill.val);
    case 'week_d':
      return data.filter((b) => b.d && ws(b.d) === drill.val);
    case 'cum_c':
      return data.filter((b) => ws(b.c) <= drill.val);
    case 'cum_r':
      return data.filter((b) => b.r && ws(b.r) <= drill.val);
    case 'assignee_open':
      return data.filter((b) => isOpen(b) && b.a === drill.val);
    case 'workspace':
      return data.filter((b) => b.w.includes(drill.val));
    case 'workspace_open':
      return data.filter((b) => b.w.includes(drill.val) && isOpen(b));
    case 'reg':
      return data.filter((b) => b.reg?.includes(drill.val));
    case 'os':
      return data.filter((b) => b.os?.includes(drill.val));
    case 'age': {
      const ranges = [
        [0, 7],
        [8, 30],
        [31, 60],
        [61, 99999],
      ];
      const [mn, mx] = ranges[drill.val] || [0, 99999];
      return data.filter((b) => {
        if (!isOpen(b) || !b.c) return false;
        const d = Math.floor((today - new Date(b.c + 'T00:00:00')) / 86400000);
        return !isNaN(d) && d >= mn && d <= mx;
      });
    }
    default:
      return data;
  }
}

export function BacklogTable({ issues, drill, onClearDrill, showWorkspace = false }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState(0);

  function handleFilterChange(key, val) {
    setFilters((prev) => ({ ...prev, [key]: val }));
  }

  function handleClear() {
    setFilters(INITIAL_FILTERS);
    setSortCol(null);
    setSortDir(0);
    onClearDrill();
  }

  function toggleSort(col) {
    if (sortCol === col) {
      const next = (sortDir + 1) % 3;
      if (next === 2) {
        setSortCol(null);
        setSortDir(0);
      } else setSortDir(next);
    } else {
      setSortCol(col);
      setSortDir(1);
    }
  }

  useEffect(() => {
    if (!drill) return;
    if (drill.key === 'reg') {
      setFilters((prev) => ({ ...prev, reg: [drill.val] }));
    } else if (drill.key === 'os') {
      setFilters((prev) => ({ ...prev, os: [drill.val] }));
    } else if (drill.key === 'p') {
      setFilters((prev) => ({ ...prev, priority: [drill.val] }));
    } else if (drill.key === 'assignee_open') {
      setFilters((prev) => ({ ...prev, assignee: [drill.val] }));
    } else if (drill.key === 'blocked') {
      setFilters((prev) => ({ ...prev, status: ['Blocked'] }));
    } else if (drill.key === 'pending_deployment') {
      setFilters((prev) => ({ ...prev, pendingDeployment: true }));
    }
  }, [drill?.key, drill?.val]);

  const displayed = useMemo(() => {
    let data = applyDrill([...issues], drill);

    const { search, priority, status, assignee, reg, os, noActionDone, pendingDeployment } = filters;
    if (search)
      data = data.filter(
        (b) =>
          b.k.toLowerCase().includes(search) ||
          b.s.toLowerCase().includes(search)
      );
    if (priority.length) data = data.filter((b) => priority.includes(b.p));
    if (status.length) data = data.filter((b) => status.includes(b.st));
    if (assignee.length) data = data.filter((b) => assignee.includes(b.a));
    if (reg.length) data = data.filter((b) => b.reg?.some((r) => reg.includes(r)));
    if (os.length) data = data.filter((b) => b.os?.some((o) => os.includes(o)));
    if (noActionDone) data = data.filter(hasNoActionDoneLabel);
    if (pendingDeployment) data = data.filter(needsDeployment);

    if (drill?.key === 'blocked' && !sortCol) {
      data = [...data].sort((a, b) => (PSORT[a.p] ?? 99) - (PSORT[b.p] ?? 99));
    }

    if (sortCol && sortDir > 0) {
      data = [...data].sort((a, b) => {
        if (sortCol === 'p') {
          const va = PSORT[a.p] ?? 99,
            vb = PSORT[b.p] ?? 99;
          return sortDir === 1 ? va - vb : vb - va;
        }
        const va = a[sortCol] || '',
          vb = b[sortCol] || '';
        return sortDir === 1 ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }

    return data;
  }, [issues, drill, filters, sortCol, sortDir]);

  function thClass(col) {
    const base =
      'text-left px-3.5 py-2.5 font-semibold text-[11px] text-[#8896b0] bg-[#f5f7fa] border-b border-[#dde2ea] uppercase tracking-[.5px] whitespace-nowrap cursor-pointer select-none hover:text-brand hover:bg-[#eef2fb]';
    if (sortCol === col)
      return `${base} text-brand${
        sortDir === 1 ? " after:content-['_↑']" : " after:content-['_↓']"
      }`;
    return base;
  }

  const lockedField = drillToFilterField(drill);

  return (
    <div>
      <DrillBadge drill={drill} onClear={handleClear} />
      <FilterBar
        issues={issues}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClear}
        lockedField={lockedField}
      />
      <div className="text-[12px] text-[#8896b0] mb-2">
        Showing {displayed.length} of {issues.length} issues
      </div>
      <div className="border border-[#dde2ea] rounded-lg overflow-hidden">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="text-left px-3.5 py-2.5 font-semibold text-[11px] text-[#8896b0] bg-[#f5f7fa] border-b border-[#dde2ea] uppercase tracking-[.5px] whitespace-nowrap">
                  Key
                </th>
                <th className="text-left px-3.5 py-2.5 font-semibold text-[11px] text-[#8896b0] bg-[#f5f7fa] border-b border-[#dde2ea] uppercase tracking-[.5px] whitespace-nowrap">
                  Summary
                </th>
                <th onClick={() => toggleSort('st')} className={thClass('st')}>
                  Status
                </th>
                <th onClick={() => toggleSort('p')} className={thClass('p')}>
                  Priority
                </th>
                <th onClick={() => toggleSort('a')} className={thClass('a')}>
                  Assignee
                </th>
                {showWorkspace && (
                  <th onClick={() => toggleSort('w')} className={thClass('w')}>
                    Workspace
                  </th>
                )}
                <th className="text-left px-3.5 py-2.5 font-semibold text-[11px] text-[#8896b0] bg-[#f5f7fa] border-b border-[#dde2ea] uppercase tracking-[.5px] whitespace-nowrap">
                  Created
                </th>
                <th className="text-left px-3.5 py-2.5 font-semibold text-[11px] text-[#8896b0] bg-[#f5f7fa] border-b border-[#dde2ea] uppercase tracking-[.5px] whitespace-nowrap">
                  Resolved
                </th>
                <th className="text-left px-3.5 py-2.5 font-semibold text-[11px] text-[#8896b0] bg-[#f5f7fa] border-b border-[#dde2ea] uppercase tracking-[.5px] whitespace-nowrap">
                  Deployed
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((b, idx) => (
                <tr key={b.k} className="hover:bg-[#f8faff]">
                  <td
                    className={`px-3.5 py-[9px] ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                  >
                    <a
                      href={`${JIRA_BASE}/${b.k}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand font-semibold font-mono text-[11.5px] hover:underline"
                    >
                      {b.k}
                    </a>
                  </td>
                  <td
                    className={`px-3.5 py-[9px] max-w-[280px] truncate ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                    title={b.s}
                  >
                    {b.s}
                  </td>
                  <td
                    className={`px-3.5 py-[9px] ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                  >
                    <StatusPill status={b.st} />
                  </td>
                  <td
                    className={`px-3.5 py-[9px] ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                  >
                    <PriorityPill priority={b.p} />
                  </td>
                  <td
                    className={`px-3.5 py-[9px] whitespace-nowrap text-[12px] text-[#5a6075] ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                  >
                    {b.a}
                  </td>
                  {showWorkspace && (
                    <td
                      className={`px-3.5 py-[9px] max-w-[180px] truncate text-[12px] text-[#5a6075] ${
                        idx < displayed.length - 1
                          ? 'border-b border-[#eef0f4]'
                          : ''
                      }`}
                      title={b.w?.length ? b.w.join(' & ') : '-'}
                    >
                      {b.w?.length ? b.w.join(' & ') : '-'}
                    </td>
                  )}
                  <td
                    className={`px-3.5 py-[9px] whitespace-nowrap text-[12px] text-[#9aa0b4] ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                  >
                    {b.c || '-'}
                  </td>
                  <td
                    className={`px-3.5 py-[9px] whitespace-nowrap text-[12px] text-[#9aa0b4] ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                  >
                    {b.r || '-'}
                  </td>
                  <td
                    className={`px-3.5 py-[9px] whitespace-nowrap text-[12px] text-[#9aa0b4] ${
                      idx < displayed.length - 1
                        ? 'border-b border-[#eef0f4]'
                        : ''
                    }`}
                  >
                    {b.d || '-'}
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td
                    colSpan={showWorkspace ? 9 : 8}
                    className="px-3.5 py-8 text-center text-[13px] text-[#8896b0]"
                  >
                    No issues match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
