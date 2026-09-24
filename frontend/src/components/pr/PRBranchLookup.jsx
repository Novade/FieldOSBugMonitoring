import { useEffect, useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { BranchPicker } from './BranchPicker';
import { fetchGHBranches, fetchGHPRsByBranch } from '../../services/githubService';

const STATE_PRIORITY = { OPEN: 0, MERGED: 1, CLOSED: 2 };

const COLUMNS = [
  { key: 'number', label: 'PR #', get: (p) => p.number },
  { key: 'author', label: 'Author', get: (p) => p.author },
  { key: 'state', label: 'Status', get: (p) => STATE_PRIORITY[p.state] ?? 3 },
  { key: 'createdAt', label: 'Created Date', get: (p) => new Date(p.createdAt).getTime() },
  {
    key: 'resolvedAt',
    label: 'Merged/Closed Date',
    get: (p) => new Date(p.mergedAt || p.closedAt || 0).getTime(),
  },
];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function PRStatePill({ state }) {
  const styles = {
    OPEN: 'bg-[#e4f4ed] text-[#2e7d5e]',
    MERGED: 'bg-[#eef0fc] text-[#5c4fa3]',
    CLOSED: 'bg-[#f0f2f5] text-[#6b7a99]',
  };
  const labels = { OPEN: 'Open', MERGED: 'Merged', CLOSED: 'Closed' };
  return (
    <span
      className={`inline-block px-[9px] py-[2px] rounded-[20px] text-[11px] font-semibold whitespace-nowrap ${styles[state] || ''}`}
    >
      {labels[state] || state}
    </span>
  );
}

export function PRBranchLookup({ repoNames }) {
  const [selectedRepo, setSelectedRepo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState(null);
  const [prs, setPrs] = useState(null);
  const [prsLoading, setPrsLoading] = useState(false);
  const [prsError, setPrsError] = useState(null);
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    if (!selectedRepo) {
      setBranches([]);
      return;
    }
    setSelectedBranch('');
    setPrs(null);
    setPrsError(null);
    setBranchesLoading(true);
    setBranchesError(null);
    fetchGHBranches(selectedRepo)
      .then((data) => setBranches(data.branches || []))
      .catch((err) => setBranchesError(err.message))
      .finally(() => setBranchesLoading(false));
  }, [selectedRepo]);

  function handleSelectBranch(branch) {
    setSelectedBranch(branch);
    setPrsLoading(true);
    setPrsError(null);
    setPrs(null);
    fetchGHPRsByBranch(selectedRepo, branch)
      .then((data) => setPrs(data.prs || []))
      .catch((err) => setPrsError(err.message))
      .finally(() => setPrsLoading(false));
  }

  const sortedPrs = useMemo(() => {
    if (!prs?.length) return [];
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (!col) return prs;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...prs].sort((a, b) => {
      const av = col.get(a);
      const bv = col.get(b);
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av).localeCompare(String(bv)) * dir;
      }
      return (av - bv) * dir;
    });
  }, [prs, sortKey, sortDir]);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <select
          value={selectedRepo}
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="text-[13px] border border-[#dde2ea] rounded-lg px-3 py-2 bg-white text-[#1a2332] cursor-pointer"
        >
          <option value="">Select repo</option>
          {repoNames.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <BranchPicker
          branches={branches}
          selected={selectedBranch}
          onSelect={handleSelectBranch}
          disabled={!selectedRepo}
        />
        {branchesLoading && <span className="text-[12px] text-[#8896b0]">Loading branches…</span>}
        {branchesError && <span className="text-[12px] text-[#c0392b]">{branchesError}</span>}
      </div>

      {!selectedRepo && (
        <div className="text-[#8896b0] text-sm py-6 text-center">
          Select a repo and branch to see its PRs.
        </div>
      )}

      {selectedRepo && !selectedBranch && (
        <div className="text-[#8896b0] text-sm py-6 text-center">Select a branch.</div>
      )}

      {selectedBranch && prsLoading && (
        <div className="text-[#8896b0] text-sm py-6 text-center">Loading PRs…</div>
      )}

      {selectedBranch && prsError && (
        <div className="text-[#c0392b] text-sm py-6 text-center">{prsError}</div>
      )}

      {selectedBranch && !prsLoading && !prsError && prs && prs.length === 0 && (
        <div className="text-[#8896b0] text-sm py-6 text-center">
          No PRs found targeting {selectedBranch} in {selectedRepo}.
        </div>
      )}

      {selectedBranch && !prsLoading && !prsError && prs && prs.length > 0 && (
        <div className="border border-[#dde2ea] rounded-lg overflow-hidden">
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 z-10 bg-[#f5f7fa]">
                <tr className="bg-[#f5f7fa] border-b border-[#dde2ea]">
                  <th className="text-left px-4 py-2.5 font-semibold text-[#6b7a99] text-[11px] uppercase tracking-[.4px]">
                    PR
                  </th>
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
                    <td className="px-4 py-2.5 text-[#1a2332] max-w-[320px]">
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
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <PRStatePill state={pr.state} />
                    </td>
                    <td className="px-4 py-2.5 text-[#6b7a99] whitespace-nowrap">{formatDate(pr.createdAt)}</td>
                    <td className="px-4 py-2.5 text-[#6b7a99] whitespace-nowrap">
                      {formatDate(pr.mergedAt || pr.closedAt)}
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
