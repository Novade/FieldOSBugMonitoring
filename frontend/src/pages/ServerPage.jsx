import { useState, useMemo, useEffect } from 'react';
import {
  useMonitors,
  useHistory,
  useDailyData,
} from '../hooks/useAdminLabsData';
import { CURRENT_YEAR, MONTH_LABELS } from '../utils/serverUtils';
import { ServerControlsBar } from '../components/server/ServerControlsBar';
import { ServerKpiRow } from '../components/server/ServerKpiRow';
import { YearOverYearChart } from '../components/charts/YearOverYearChart';
import { MonthBreakdownTable } from '../components/server/MonthBreakdownTable';
import { DayBreakdownTable } from '../components/server/DayBreakdownTable';
import { Spinner } from '../components/common/Spinner';
export function ServerPage() {
  const {
    monitors,
    loading: monitorsLoading,
    error: monitorsError,
  } = useMonitors();
  const [selectedMonitorId, setSelectedMonitorId] = useState('all');
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const { data, loading, error } = useHistory({
    monitorId: selectedMonitorId,
    year: selectedYear,
  });
  const {
    data: dailyData,
    loading: dailyLoading,
    error: dailyError,
  } = useDailyData({
    monitorId: selectedMonitorId,
    year: selectedYear,
    month: selectedMonth,
  });

  useEffect(() => {
    setSelectedMonth(null);
  }, [selectedMonitorId, selectedYear]);

  const tabs = useMemo(
    () => [
      { name: 'All', id: 'all' },
      ...monitors.map(({ name, id }) => ({ name, id: String(id) })),
    ],
    [monitors]
  );

  const allMonths = data?.months || [];

  const kpis = useMemo(() => {
    const valid = allMonths.filter(
      (m) => !m.error && m.avgServiceLevel != null
    );
    if (!valid.length)
      return { avgSL: null, totalDowntime: 0, totalOutages: 0, avgDowntime: 0 };
    const avgSL = (
      valid.reduce((s, m) => s + m.avgServiceLevel, 0) / valid.length
    ).toFixed(3);
    const totalDowntime = valid.reduce((s, m) => s + m.totalDowntime, 0);
    const totalOutages = valid.reduce((s, m) => s + m.totalOutages, 0);
    return {
      avgSL,
      totalDowntime,
      totalOutages,
      avgDowntime: Math.round(totalDowntime / valid.length),
    };
  }, [allMonths]);

  const selectedTabName =
    tabs.find((t) => t.id === selectedMonitorId)?.name || 'All';
  const selectedMonthName = selectedMonth
    ? MONTH_LABELS[selectedMonth - 1]
    : null;
  const days = dailyData?.days ?? [];

  if (loading && !data) return <Spinner label="Loading server data…" />;

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      <ServerControlsBar
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        selectedMonitorId={selectedMonitorId}
        onMonitorChange={setSelectedMonitorId}
        tabs={tabs}
        monitorsLoading={monitorsLoading}
        monitorsError={monitorsError}
        error={error}
      />

      <ServerKpiRow kpis={kpis} />

      <div className="mb-4">
        <YearOverYearChart
          selectedMonitorId={selectedMonitorId}
          selectedTabName={selectedTabName}
        />
      </div>

      <div className="grid grid-cols-2 max-[900px]:grid-cols-1 gap-4">
        <MonthBreakdownTable
          allMonths={allMonths}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          selectedYear={selectedYear}
        />
        <DayBreakdownTable
          days={days}
          loading={dailyLoading}
          error={dailyError}
          selectedMonth={selectedMonth}
          selectedMonthName={selectedMonthName}
          selectedYear={selectedYear}
          selectedTabName={selectedTabName}
        />
      </div>
    </div>
  );
}
