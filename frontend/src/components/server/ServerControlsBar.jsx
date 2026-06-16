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
          className="text-[14px] text-[#4a5568] border border-[#dde2ea] rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#3b6cb7]"
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
                    ? 'bg-[#e2e5ea] text-[#6b7a99]'
                    : isDisabled || monitorsLoading
                    ? 'text-[#b0bac8] cursor-not-allowed'
                    : 'text-[#6b7a99] hover:bg-[#f0f2f5]'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {monitorsError && (
        <p className="text-amber-700 text-[13px] mb-4 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Could not load monitor list: {monitorsError}. Showing "All" view.
        </p>
      )}

      {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}
    </>
  );
}
