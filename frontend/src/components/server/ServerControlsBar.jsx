import { YEARS } from '../../utils/serverUtils';

export function ServerControlsBar({
  selectedYear, onYearChange,
  selectedMonitorId, onMonitorChange,
  tabs, monitorsLoading, monitorsError, error,
}) {
  return (
    <>
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="text-[14px] text-ink-soft border border-line rounded-md px-3 py-2 bg-surface focus:outline-none focus:ring-1 focus:ring-[#3b6cb7]"
        >
          {YEARS.map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>

        <div className="flex gap-1.5 flex-wrap">
          {tabs.map(({ name, id }) => {
            const isActive = selectedMonitorId === id;
            const isDisabled = id === null;
            return (
              <button
                key={name}
                type="button"
                disabled={isDisabled || monitorsLoading}
                onClick={() => id && onMonitorChange(id)}
                className={`px-3 py-2 rounded-md text-[14px] font-medium transition-colors ${
                  isActive
                    ? 'bg-surface-strong text-ink-muted'
                    : isDisabled || monitorsLoading
                    ? 'text-ink-faint cursor-not-allowed'
                    : 'text-ink-muted hover:bg-canvas-alt'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {monitorsError && (
        <p className="text-warning-ink text-[13px] mb-4 bg-warning-tint border border-warning-line rounded-md px-3 py-2">
          Could not load monitor list: {monitorsError}. Showing "All" view.
        </p>
      )}

      {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}
    </>
  );
}
