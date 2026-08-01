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

// Generic weekly P75 trend line — used for Cycle Time, First Review, and PR
// Size so all three share one implementation instead of near-duplicates.
export function PRTrendChart({ weeklyTrend, metricKey, label, axisLabel, color, unit, decimals = 1, target, chartId }) {
  const { labels, datasets } = useMemo(() => {
    if (!weeklyTrend?.length) return { labels: [], datasets: [] };

    const values = weeklyTrend.map((w) => w[metricKey]);

    const datasets = [
      {
        label: `P75 ${label}`,
        data: values,
        borderColor: color,
        backgroundColor: `${color}14`,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: color,
        tension: 0.3,
        fill: true,
        spanGaps: true,
      },
    ];

    if (target != null) {
      datasets.push({
        label: `${target}${unit} Target`,
        data: weeklyTrend.map(() => target),
        borderColor: '#c0392b',
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      });
    }

    return { labels: weeklyTrend.map((w) => w.label), datasets };
  }, [weeklyTrend, metricKey, label, color, unit, target]);

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
              ? `  Target: ${target}${unit}`
              : item.parsed.y == null
              ? null
              : `  P75: ${item.parsed.y.toFixed(decimals)}${unit}`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 10 }, callback: (v) => `${v}${unit}` },
        title: { display: true, text: axisLabel, font: { size: 11 }, color: '#8896b0' },
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: 220 }}>
      <Line data={{ labels, datasets }} options={options} id={chartId} />
    </div>
  );
}
