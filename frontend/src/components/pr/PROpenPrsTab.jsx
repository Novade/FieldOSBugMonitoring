import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { formatHoursShort } from '../../utils/dateUtils';

// Each column declares how to extract its sortable value
const COLUMNS = [
  { key: 'number', label: 'PR #', get: (p) => p.number },
  { key: 'author', label: 'Author', get: (p) => p.author },
  { key: 'repo', label: 'Repo', get: (p) => p.repo },
  { key: 'createdAt', label: 'Created Date', get: (p) => new Date(p.createdAt).getTime() },
  { key: 'elapsedHours', label: 'Open For', get: (p) => p.elapsedHours },
  { key: 'sizeLines', label: 'Lines', get: (p) => p.sizeLines },
  { key: 'phase', label: 'Phase', get: (p) => p.phase },
  { key: 'status', label: 'Status', get: (p) => p.status },
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
  };
  return (
    <span
      className={`inline-block px-[9px] py-[2px] rounded-[20px] text-[11px] font-semibold whitespace-nowrap ${styles[status] || ''}`}
    >
      {status}
    </span>
  );
}

function PhasePill({ phase }) {
  const styles = {
    'Waiting 1st review': 'bg-[#f0f2f5] text-[#6b7a99]',
    'Review in progress': 'bg-[#eef3fc] text-[#2d5a9e]',
    Approved: 'bg-[#e4f4ed] text-[#2e7d5e]',
    'Changes requested': 'bg-[#fef3e2] text-[#d97706]',
  };
  return (
    <span
      className={`inline-block px-[9px] py-[2px] rounded-[20px] text-[11px] font-semibold whitespace-nowrap ${styles[phase] || 'bg-[#f0f2f5] text-[#6b7a99]'}`}
    >
      {phase}
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

export function PROpenPrsTab({ openPrs }) {
  // Default: newest PR first (latest created date at top), oldest at the bottom
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const stats = useMemo(() => {
    if (!openPrs?.length) return { total: 0, breached: 0, atRisk: 0, onTrack: 0 };
    return {
      total: openPrs.length,
      breached: openPrs.filter((p) => p.status === 'Breached').length,
      atRisk: openPrs.filter((p) => p.status === 'At Risk').length,
      onTrack: openPrs.filter((p) => p.status === 'On Track').length,
    };
  }, [openPrs]);

  const sortedPrs = useMemo(() => {
    if (!openPrs?.length) return [];
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (!col) return openPrs;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...openPrs].sort((a, b) => {
      const av = col.get(a);
      const bv = col.get(b);
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return (av - bv) * dir;
    });
  }, [openPrs, sortKey, sortDir]);

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
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Open" value={stats.total} accent="blue" />
        <StatCard label="Breached (>24h)" value={stats.breached} accent="rose" />
        <StatCard label="At Risk (>18h)" value={stats.atRisk} accent="amber" />
        <StatCard label="On Track" value={stats.onTrack} accent="teal" />
      </div>

      {openPrs.length === 0 ? (
        <div className="text-[#8896b0] text-sm py-6 text-center">No open PRs.</div>
      ) : (
        <div className="border border-[#dde2ea] rounded-lg overflow-hidden">
          <div className="max-h-[520px] overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10 bg-[#f5f7fa]">
              <tr className="bg-[#f5f7fa] border-b border-[#dde2ea]">
                {COLUMNS.map((col) => {
                  const active = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="text-left px-4 py-2.5 font-semibold text-[#6b7a99] text-[11px] uppercase tracking-[.4px] cursor-pointer select-none hover:text-[#3b6cb7]"
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
                  <td className="px-4 py-2.5 text-[#1a2332] max-w-[280px]">
                    <a
                      href={pr.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[#3b6cb7] hover:underline truncate block"
                    >
                      #{pr.number} - {pr.title}
                    </a>
                  </td>
                  <td className="px-4 py-2.5 text-[#6b7a99] whitespace-nowrap">{pr.author}</td>
                  <td className="px-4 py-2.5 text-[#6b7a99] whitespace-nowrap">{pr.repo}</td>
                  <td className="px-4 py-2.5 text-[#6b7a99] whitespace-nowrap">{formatDate(pr.createdAt)}</td>
                  <td className="px-4 py-2.5 text-[#1a2332] whitespace-nowrap font-medium">
                    {formatHoursShort(pr.elapsedHours)}
                  </td>
                  <td className="px-4 py-2.5 text-[#6b7a99] whitespace-nowrap">
                    <span className="text-[#2e7d5e]">+{pr.additions}</span>
                    {' '}
                    <span className="text-[#c0392b]">-{pr.deletions}</span>
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <PhasePill phase={pr.phase} />
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <StatusPill status={pr.status} />
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
