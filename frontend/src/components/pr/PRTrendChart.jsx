import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const TARGET_HOURS = 24;

export function PRTrendChart({ weeklyTrend }) {
  const { labels, datasets } = useMemo(() => {
    if (!weeklyTrend?.length) return { labels: [], datasets: [] };

    const labs = weeklyTrend.map((w) => w.label);
    const values = weeklyTrend.map((w) => w.cycletime_p75);

    return {
      labels: labs,
      datasets: [
        {
          label: 'P75 Cycle Time',
          data: values,
          borderColor: '#3b6cb7',
          backgroundColor: 'rgba(59,108,183,0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#3b6cb7',
          tension: 0.3,
          fill: true,
          spanGaps: true,
        },
        {
          label: '24h Target',
          data: weeklyTrend.map(() => TARGET_HOURS),
          borderColor: '#c0392b',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [weeklyTrend]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // Show the tooltip when hovering anywhere along the week, not only on the point
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_DEFAULTS,
        callbacks: {
          label: (item) =>
            item.datasetIndex === 1
              ? `  Target: ${TARGET_HOURS}h`
              : item.parsed.y == null
              ? null
              : `  P75: ${item.parsed.y.toFixed(1)}h`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 10 }, callback: (v) => `${v}h` },
        title: { display: true, text: 'Hours', font: { size: 11 }, color: '#8896b0' },
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: 220 }}>
      <Line data={{ labels, datasets }} options={options} id="prTrend" />
    </div>
  );
}
