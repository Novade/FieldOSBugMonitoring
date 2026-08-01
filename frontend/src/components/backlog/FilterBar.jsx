import { useEffect, useMemo, useRef, useState } from 'react';
import { PORDER } from '../../constants/jira';
import { REGION_ALL, OS_ALL } from '../../utils/fieldUtils';

const FILTER_FIELDS = [
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'reg', label: 'Region' },
  { key: 'os', label: 'OS' },
];

const BOOLEAN_FILTERS = [
  { key: 'noActionDone', label: 'No Action Done' },
  { key: 'pendingDeployment', label: 'Validated, pending deployment' },
];

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function FilterPanel({ open, onClose, filters, onFilterChange, fieldOptions, lockedField }) {
  const [activeField, setActiveField] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const activeOptions = activeField ? (fieldOptions[activeField] ?? []) : [];
  const activeSelected = activeField ? (filters[activeField] ?? []) : [];
  const lockedValue =
    activeField && lockedField?.field === activeField ? lockedField.value : null;

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#dde2ea] rounded-lg shadow-lg flex"
      style={{ width: 380, height: 280 }}
    >
      {/* Left column */}
      <div className="w-44 border-r border-[#dde2ea] py-2 shrink-0 overflow-y-auto">
        {FILTER_FIELDS.map((f) => {
          const count = filters[f.key]?.length ?? 0;
          const isActive = activeField === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveField(f.key)}
              className={`w-full text-left px-4 py-2 text-[13px] flex items-center justify-between transition-colors
                ${isActive
                  ? 'bg-[#eef2fb] text-brand font-semibold border-l-2 border-brand'
                  : 'text-[#1a2332] hover:bg-[#f5f7fa] border-l-2 border-transparent'
                }`}
            >
              {f.label}
              {count > 0 && (
                <span className="text-[11px] text-brand font-semibold">{count}</span>
              )}
            </button>
          );
        })}
        <div className="my-1 mx-2 border-t border-[#dde2ea]" />
        {BOOLEAN_FILTERS.map((f) => {
          const active = !!filters[f.key];
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key, !filters[f.key])}
              className={`w-full text-left px-4 py-2 text-[13px] flex items-center justify-between transition-colors
                ${active
                  ? 'bg-[#eef2fb] text-brand font-semibold'
                  : 'text-[#1a2332] hover:bg-[#f5f7fa]'
                }`}
            >
              {f.label}
              {active && <span className="text-[11px] text-brand font-semibold">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Right column */}
      <div className="flex-1 py-2 px-3 overflow-y-auto">
        {!activeField ? (
          <p className="text-[13px] text-[#8896b0] mt-4 px-1">
            Select a field to start creating a filter.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {activeOptions.map((opt) => {
              const isLocked = opt === lockedValue;
              const checked = activeSelected.includes(opt) || isLocked;
              return (
                <label
                  key={opt}
                  className={`flex items-center gap-2 px-1 py-1.5 rounded text-[13px] select-none
                    ${isLocked ? 'text-[#8896b0] cursor-not-allowed' : 'text-[#1a2332] hover:bg-[#f5f7fa] cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isLocked}
                    onChange={() => {
                      if (isLocked) return;
                      onFilterChange(activeField, toggle(filters[activeField] ?? [], opt));
                    }}
                    className="accent-brand"
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function FilterBar({ issues, filters, onFilterChange, onClear, lockedField }) {
  const [open, setOpen] = useState(false);

  const { statuses, assignees } = useMemo(() => {
    const st = [...new Set(issues.map((b) => b.st))].sort();
    const all = [...new Set(issues.map((b) => b.a))];
    const unassigned = all.includes('Unassigned') ? ['Unassigned'] : [];
    const named = all.filter((a) => a !== 'Unassigned').sort();
    return { statuses: st, assignees: [...unassigned, ...named] };
  }, [issues]);

  const fieldOptions = {
    priority: PORDER.filter((p) => issues.some((b) => b.p === p)),
    status: statuses,
    assignee: assignees,
    reg: REGION_ALL,
    os: OS_ALL,
  };

  const activeCount =
    FILTER_FIELDS.reduce((sum, f) => sum + (filters[f.key]?.length ?? 0), 0) +
    BOOLEAN_FILTERS.reduce((sum, f) => sum + (filters[f.key] ? 1 : 0), 0);

  const inputClass =
    'h-[34px] px-[10px] border border-[#dde2ea] rounded-md text-[13px] bg-white text-[#1a2332] outline-none transition-colors focus:border-brand';

  return (
    <div className="flex flex-wrap gap-2 mb-3.5 items-center">
      <input
        type="text"
        placeholder="Search key or summary..."
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        className={`${inputClass} w-[220px] max-sm:w-full`}
      />

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`h-[34px] px-[10px] border rounded-md text-[13px] flex items-center gap-2 bg-white transition-colors
            ${activeCount > 0 || open ? 'border-brand text-brand' : 'border-[#dde2ea] text-[#1a2332] hover:border-brand'}`}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
            <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Filter
          {activeCount > 0 && (
            <span className="bg-brand text-white text-[11px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
              {activeCount}
            </span>
          )}
        </button>

        <FilterPanel
          open={open}
          onClose={() => setOpen(false)}
          filters={filters}
          onFilterChange={onFilterChange}
          fieldOptions={fieldOptions}
          lockedField={lockedField}
        />
      </div>

      <button
        onClick={onClear}
        className="text-[12px] text-brand cursor-pointer bg-none border-none px-2 py-1 rounded font-medium hover:bg-[#eef2fb] transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}
