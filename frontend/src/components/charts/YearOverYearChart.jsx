import { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { Card } from '../common/Card';
import { Spinner } from '../common/Spinner';
import { fetchHistory } from '../../services/adminLabsService';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';
import { MONTH_LABELS, YEARS, YOY_COLORS } from '../../utils/serverUtils';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ChartTooltip, Legend);

export function YearOverYearChart({ selectedMonitorId, selectedTabName }) {
  const [yoyData, setYoyData] = useState({});
  const [yoyLoading, setYoyLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setYoyLoading(true);
    setYoyData({});

    async function load() {
      const map = {};
      for (const yr of YEARS) {
        if (cancelled) return;
        try {
          const result = await fetchHistory({ monitorId: selectedMonitorId, year: yr });
          map[yr] = result?.months || [];
        } catch {
          map[yr] = [];
        }
      }
      if (!cancelled) {
        setYoyData(map);
        setYoyLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedMonitorId]);

  const chartData = useMemo(() => ({
    labels: MONTH_LABELS,
    datasets: YEARS.map((yr, i) => {
      const months = yoyData[yr] || [];
      return {
        label: String(yr),
        data: MONTH_LABELS.map((_, mi) => {
          const m = months.find((d) => d.month === mi + 1);
          return m && !m.error ? m.avgServiceLevel : null;
        }),
        borderColor: YOY_COLORS[i],
        backgroundColor: YOY_COLORS[i] + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        spanGaps: false,
      };
    }),
  }), [yoyData]);

  const chartOptions = useMemo(() => {
    const allValues = Object.values(yoyData)
      .flat()
      .filter((m) => m && !m.error && m.avgServiceLevel != null)
      .map((m) => m.avgServiceLevel);
    const dataMin = allValues.length ? Math.min(...allValues) : 90;
    const padding = Math.max(0.05, (100 - dataMin) * 0.3);
    const rawMin = Math.max(85, dataMin - padding);
    const range = 100 - rawMin;
    const step = range <= 0.5 ? 0.1 : range <= 1 ? 0.2 : range <= 2 ? 0.5 : range <= 5 ? 1 : 2;
    const stepsBelow100 = Math.ceil((100 - rawMin) / step);
    const yMin = parseFloat((100 - stepsBelow100 * step).toFixed(2));

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } },
        tooltip: {
          ...TOOLTIP_DEFAULTS,
          mode: 'index',
          intersect: false,
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (item) =>
              `  ${item.dataset.label}: ${item.raw != null ? item.raw.toFixed(3) + '%' : 'N/A'}`,
          },
        },
      },
      scales: {
        x: { ticks: { font: { size: 11 } }, grid: { display: false } },
        y: {
          min: yMin,
          max: 100.3,
          ticks: { font: { size: 11 }, stepSize: step, callback: (v) => v <= 100 ? `${v}%` : '' },
          grid: { color: '#f0f2f5' },
        },
      },
    };
  }, [yoyData]);

  return (
    <Card accent="purple" title="Year-over-Year Service Level" subtitle={selectedTabName}>
      {yoyLoading ? <Spinner height={260} /> : (
        <div style={{ height: 260 }}>
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </Card>
  );
}
