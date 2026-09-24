import { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import { formatHoursShort } from '../../utils/dateUtils';
import { fetchGHResolvedPRs } from '../../services/githubService';

const LEGEND_ITEMS = [
  { color: '#c0392b', label: 'Breaching' },
  { color: '#d97706', label: 'Close' },
  { color: '#2e7d5e', label: 'Compliant' },
];

// Each column's width is a clamp(min, preferred%, max) — it scales with the
// window/container width like a percentage would (filling extra room on a
// wide monitor), but never shrinks below the min it actually needs or grows
// past a sensible max. Pure CSS, no resize listeners needed.
//
// PR title is the actual point of this table, so it needs real room rather
// than splitting it 10 ways — Repo+Branch and Phase+Status are stacked into
// single columns (still fully visible, just two lines instead of two
// columns), and Resolved only shows up once there's something to show. PR
// itself has no fixed width: table-fixed hands it whatever's left over, and
// its content still truncates with a tooltip if a title is genuinely long.
const BASE_COLUMNS = [
  { key: 'number', label: 'PR #', get: (p) => p.number },
  { key: 'author', label: 'Author', get: (p) => p.author, width: 'clamp(100px, 8%, 160px)' },
  {
    key: 'repo',
    label: 'Repo / Branch',
    get: (p) => `${p.repo} ${p.branch || ''}`,
    width: 'clamp(150px, 12%, 230px)',
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    get: (p) => new Date(p.createdAt).getTime(),
    width: 'clamp(85px, 7%, 115px)',
  },
  { key: 'elapsedHours', label: 'Open For', get: (p) => p.elapsedHours ?? -1, width: 'clamp(60px, 5%, 85px)' },
  {
    key: 'resolvedAt',
    label: 'Resolved',
    get: (p) => (p.resolvedAt ? new Date(p.resolvedAt).getTime() : 0),
    width: 'clamp(80px, 6%, 110px)',
    onlyWhenResolvedShown: true,
  },
  { key: 'sizeLines', label: 'Lines', get: (p) => p.sizeLines, width: 'clamp(75px, 6%, 110px)' },
  { key: 'status', label: 'Status / Phase', get: (p) => p.status, width: 'clamp(120px, 9%, 170px)' },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusPill({ status }) {
  const styles = {
    Breached: 'bg-[#fde8e8] text-[#c0392b]',
    'At Risk': 'bg-[#fef3e2] text-[#d97706]',
    'On Track': 'bg-[#e4f4ed] text-[#2e7d5e]',
    Merged: 'bg-[#eef0fc] text-[#5c4fa3]',
    Closed: 'bg-[#f0f2f5] text-[#6b7a99]',
  };
  return (
    <span
      className={`inline-block px-[9px] py-[2px] rounded-[20px] text-[11px] font-semibold whitespace-nowrap ${styles[status] || ''}`}
    >
      {status}
    </span>
  );
}

function StatCard({ label, value, accent }) {
  const accentColors = {
    rose: 'border-t-[#c0392b]',
    amber: 'border-t-[#d97706]',
    teal: 'border-t-[#2e7d5e]',
    blue: 'border-t-[#3b6cb7]',
  };
  return (
    <div
      className={`bg-white rounded-lg border border-[#dde2ea] px-4 py-[14px] flex-1 min-w-[140px] border-t-[3px] ${accentColors[accent] || accentColors.blue}`}
    >
      <div className="text-[12px] font-semibold uppercase tracking-[.5px] mb-3 text-[#6b7a99]">{label}</div>
      <div className="text-[28px] font-bold text-[#1a2332]">{value ?? '—'}</div>
    </div>
  );
}

const SELECT_CLASS =
  'text-[13px] border border-[#dde2ea] rounded-lg px-3 py-2 bg-white text-[#1a2332] cursor-pointer';

export function PROpenPrsTab({ openPrs }) {
  const [selectedRepo, setSelectedRepo] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showResolved, setShowResolved] = useState(false);
  const [resolvedPrs, setResolvedPrs] = useState(null);
  const [resolvedLoading, setResolvedLoading] = useState(false);
  const [resolvedError, setResolvedError] = useState(null);

  // Default: newest PR first (latest created date at top), oldest at the bottom
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  function handleToggleResolved(e) {
    const checked = e.target.checked;
    setShowResolved(checked);
    if (checked && resolvedPrs === null && !resolvedLoading) {
      setResolvedLoading(true);
      setResolvedError(null);
      fetchGHResolvedPRs()
        .then((data) => setResolvedPrs(data.resolvedPRs || []))
        .catch((err) => setResolvedError(err.message))
        .finally(() => setResolvedLoading(false));
    }
  }

  const allPrs = useMemo(() => {
    const base = openPrs || [];
    return showResolved && resolvedPrs ? [...base, ...resolvedPrs] : base;
  }, [openPrs, showResolved, resolvedPrs]);

  const repoOptions = useMemo(
    () => [...new Set(allPrs.map((p) => p.repo))].sort(),
    [allPrs]
  );

  const branchOptions = useMemo(() => {
    const pool = selectedRepo === 'all' ? allPrs : allPrs.filter((p) => p.repo === selectedRepo);
    return [...new Set(pool.map((p) => p.branch).filter(Boolean))].sort();
  }, [allPrs, selectedRepo]);

  useEffect(() => {
    if (selectedBranch !== 'all' && !branchOptions.includes(selectedBranch)) {
      setSelectedBranch('all');
    }
  }, [branchOptions, selectedBranch]);

  const filteredPrs = useMemo(
    () =>
      allPrs.filter(
        (p) =>
          (selectedRepo === 'all' || p.repo === selectedRepo) &&
          (selectedBranch === 'all' || p.branch === selectedBranch)
      ),
    [allPrs, selectedRepo, selectedBranch]
  );

  const stats = useMemo(() => {
    const openOnly = filteredPrs.filter((p) => p.state === 'OPEN');
    return {
      total: openOnly.length,
      breached: openOnly.filter((p) => p.status === 'Breached').length,
      atRisk: openOnly.filter((p) => p.status === 'At Risk').length,
      onTrack: openOnly.filter((p) => p.status === 'On Track').length,
    };
  }, [filteredPrs]);

  const columns = useMemo(
    () => BASE_COLUMNS.filter((c) => showResolved || !c.onlyWhenResolvedShown),
    [showResolved]
  );

  const sortedPrs = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredPrs;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredPrs].sort((a, b) => {
      const av = col.get(a);
      const bv = col.get(b);
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return (av - bv) * dir;
    });
  }, [filteredPrs, columns, sortKey, sortDir]);

  const filtersActive = selectedRepo !== 'all' || selectedBranch !== 'all';

  function clearFilters() {
    setSelectedRepo('all');
    setSelectedBranch('all');
  }

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (!openPrs) {
    return <div className="text-[#8896b0] text-sm py-8 text-center">Loading open PRs…</div>;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="all">All Repos</option>
            {repoOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="all">All Branches</option>
            {branchOptions.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            disabled={!filtersActive}
            className={`flex items-center gap-1 text-[13px] px-2 py-1 rounded-md ${
              filtersActive ? 'text-[#3b6cb7] hover:bg-[#eef3fc] cursor-pointer' : 'text-[#c2cbda] cursor-not-allowed'
            }`}
          >
            <X size={13} />
            Clear filters
          </button>
          <label className="flex items-center gap-1.5 text-[13px] text-[#4a5568] cursor-pointer select-none">
            <input type="checkbox" checked={showResolved} onChange={handleToggleResolved} />
            Show merged/closed (last 30 days)
          </label>
          {resolvedLoading && <span className="text-[12px] text-[#8896b0]">Loading…</span>}
          {resolvedError && <span className="text-[12px] text-[#c0392b]">{resolvedError}</span>}
        </div>

        <div className="flex gap-4">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[12px] text-[#6b7a99]">
              <span className="inline-block w-3 h-3 rounded-[2px]" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Open" value={stats.total} accent="blue" />
        <StatCard label="Breached (>24h)" value={stats.breached} accent="rose" />
        <StatCard label="At Risk (>18h)" value={stats.atRisk} accent="amber" />
        <StatCard label="On Track" value={stats.onTrack} accent="teal" />
      </div>

      {sortedPrs.length === 0 ? (
        <div className="text-[#8896b0] text-sm py-6 text-center">No PRs match the current filters.</div>
      ) : (
        <div className="border border-[#dde2ea] rounded-lg overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto overflow-x-hidden" style={{ scrollbarGutter: 'stable' }}>
          <table className="w-full table-fixed text-[12px]">
            <colgroup>
              {columns.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-[#f5f7fa]">
              <tr className="bg-[#f5f7fa] border-b border-[#dde2ea]">
                {columns.map((col) => {
                  const active = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="text-left px-3 py-2 font-semibold text-[#6b7a99] text-[11px] uppercase tracking-[.4px] cursor-pointer select-none hover:text-[#3b6cb7] truncate"
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {active ? (
                          sortDir === 'asc' ? (
                            <ChevronUp size={13} className="text-[#3b6cb7]" />
                          ) : (
                            <ChevronDown size={13} className="text-[#3b6cb7]" />
                          )
                        ) : (
                          <ChevronsUpDown size={13} className="text-[#c2cbda]" />
                        )}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedPrs.map((pr, i) => (
                <tr
                  key={`${pr.repo}-${pr.number}`}
                  className={`border-b border-[#dde2ea] hover:bg-[#f9fafc] transition-colors ${
                    i % 2 === 0 ? '' : 'bg-[#fafbfc]'
                  }`}
                >
                  <td className="px-3 py-2 text-[#1a2332] truncate" title={`#${pr.number} - ${pr.title}`}>
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#3b6cb7] hover:underline"
                    >
                      #{pr.number} - {pr.title}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-[#6b7a99] truncate" title={pr.author}>{pr.author}</td>
                  <td className="px-3 py-2 overflow-hidden" title={`${pr.repo}${pr.branch ? ' / ' + pr.branch : ''}`}>
                    <div className="text-[#6b7a99] truncate">{pr.repo}</div>
                    {pr.branch && <div className="text-[10px] text-[#8896b0] truncate">{pr.branch}</div>}
                  </td>
                  <td className="px-3 py-2 text-[#6b7a99] truncate">{formatDate(pr.createdAt)}</td>
                  <td className="px-3 py-2 text-[#1a2332] truncate font-medium">
                    {pr.elapsedHours != null ? formatHoursShort(pr.elapsedHours) : '—'}
                  </td>
                  {showResolved && (
                    <td className="px-3 py-2 text-[#6b7a99] truncate">{formatDate(pr.resolvedAt)}</td>
                  )}
                  <td className="px-3 py-2 text-[#6b7a99] truncate">
                    <span className="text-[#2e7d5e]">+{pr.additions}</span>
                    {' '}
                    <span className="text-[#c0392b]">-{pr.deletions}</span>
                  </td>
                  <td className="px-3 py-2 overflow-hidden">
                    <StatusPill status={pr.status} />
                    <div className="text-[10px] text-[#8896b0] truncate mt-0.5">{pr.phase}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
