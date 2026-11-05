import { useEffect, useRef, useState } from 'react';

function toggle(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function FilterPanel({ open, onClose, fields, filters, onFilterChange, fieldOptions, lockedField, booleanFilters }) {
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
      className="absolute top-full left-0 mt-1 z-50 bg-surface border border-line rounded-lg shadow-lg flex"
      style={{ width: 380, height: 280 }}
    >
      {/* Left column */}
      <div className="w-44 border-r border-line py-2 shrink-0 overflow-y-auto">
        {fields.map((f) => {
          const count = filters[f.key]?.length ?? 0;
          const isActive = activeField === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveField(f.key)}
              className={`w-full text-left px-4 py-2 text-[13px] flex items-center justify-between transition-colors
                ${isActive
                  ? 'bg-brand-tint text-brand font-semibold border-l-2 border-brand'
                  : 'text-ink hover:bg-canvas border-l-2 border-transparent'
                }`}
            >
              {f.label}
              {count > 0 && (
                <span className="text-[11px] text-brand font-semibold">{count}</span>
              )}
            </button>
          );
        })}
        {booleanFilters.length > 0 && <div className="my-1 mx-2 border-t border-line" />}
        {booleanFilters.map((f) => {
          const active = !!filters[f.key];
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key, !filters[f.key])}
              className={`w-full text-left px-4 py-2 text-[13px] flex items-center justify-between transition-colors
                ${active
                  ? 'bg-brand-tint text-brand font-semibold'
                  : 'text-ink hover:bg-canvas'
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
          <p className="text-[13px] text-ink-subtle mt-4 px-1">
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
                    ${isLocked ? 'text-ink-subtle cursor-not-allowed' : 'text-ink hover:bg-canvas cursor-pointer'}`}
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

// Reusable "Filter" button + popover: a field list on the left, a
// checkbox value list on the right for whichever field is selected.
// `fields`/`fieldOptions` drive what's filterable — this component has no
// domain knowledge of what it's filtering (bugs, PRs, …).
export function FilterBar({
  fields,
  fieldOptions,
  filters,
  onFilterChange,
  onClear,
  lockedField,
  booleanFilters = [],
  searchable = false,
  searchPlaceholder = 'Search...',
}) {
  const [open, setOpen] = useState(false);

  const activeCount =
    fields.reduce((sum, f) => sum + (filters[f.key]?.length ?? 0), 0) +
    booleanFilters.reduce((sum, f) => sum + (filters[f.key] ? 1 : 0), 0);

  const inputClass =
    'h-[34px] px-[10px] border border-line rounded-md text-[13px] bg-surface text-ink outline-none transition-colors focus:border-brand';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {searchable && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className={`${inputClass} w-[220px] max-sm:w-full`}
        />
      )}

      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`h-[34px] px-[10px] border rounded-md text-[13px] flex items-center gap-2 bg-surface transition-colors
            ${activeCount > 0 || open ? 'border-brand text-brand' : 'border-line text-ink hover:border-brand'}`}
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
          fields={fields}
          filters={filters}
          onFilterChange={onFilterChange}
          fieldOptions={fieldOptions}
          lockedField={lockedField}
          booleanFilters={booleanFilters}
        />
      </div>

      <button
        onClick={onClear}
        className="text-[12px] text-brand cursor-pointer bg-none border-none px-2 py-1 rounded font-medium hover:bg-brand-tint transition-colors"
      >
        Clear filters
      </button>
    </div>
  );
}
