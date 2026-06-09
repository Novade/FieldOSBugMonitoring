import { useMemo } from 'react';
import { PORDER } from '../../constants/jira';

export function FilterBar({ issues, filters, onFilterChange, onClear, lockedField }) {
  const { statuses, assignees } = useMemo(() => {
    const st = [...new Set(issues.map((b) => b.st))].sort();
    const all = [...new Set(issues.map((b) => b.a))];
    const unassigned = all.includes('Unassigned') ? ['Unassigned'] : [];
    const named = all.filter((a) => a !== 'Unassigned').sort();
    return { statuses: st, assignees: [...unassigned, ...named] };
  }, [issues]);

  const inputClass = 'h-[34px] px-[10px] border border-[#dde2ea] rounded-md text-[13px] bg-white text-[#1a2332] outline-none transition-colors focus:border-brand';
  const val = (field, filterVal) => lockedField?.field === field ? lockedField.value : filterVal;

  return (
    <div className="flex flex-wrap gap-2 mb-3.5 items-center">
      <input
        type="text"
        placeholder="Search key or summary..."
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        className={`${inputClass} w-[220px] max-sm:w-full`}
      />
      <select value={val('priority', filters.priority)} onChange={(e) => onFilterChange('priority', e.target.value)} className={inputClass}>
        <option value="">All priorities</option>
        {PORDER.filter((p) => issues.some((b) => b.p === p)).map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <select value={val('status', filters.status)} onChange={(e) => onFilterChange('status', e.target.value)} className={inputClass}>
        <option value="">All statuses</option>
        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={val('assignee', filters.assignee)} onChange={(e) => onFilterChange('assignee', e.target.value)} className={inputClass}>
        <option value="">All assignees</option>
        {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
      </select>
      <button onClick={onClear} className="text-[12px] text-brand cursor-pointer bg-none border-none px-2 py-1 rounded font-medium hover:bg-[#eef2fb] transition-colors">
        Clear filters
      </button>
    </div>
  );
}
