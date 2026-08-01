import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function repoColor(value, breaching, close) {
  if (value > breaching) return '#c0392b';
  if (close != null && value > close) return '#d97706';
  return '#2e7d5e';
}

// Renders the value centered above each vertical bar so managers don't
// need to hover to read it.
function makeTopValueLabelsPlugin(id, unit, decimals) {
  return {
    id,
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      meta.data.forEach((bar, index) => {
        const value = chart.data.datasets[0].data[index];
        if (value == null) return;
        const text = `${value.toFixed(decimals)}${unit}`;
        ctx.save();
        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = '#4a5568';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(text, bar.x, bar.y - 4);
        ctx.restore();
      });
    },
  };
}

// Dashed horizontal line marking the breaching threshold
function makeTargetLinePlugin(canvasId, targetValue) {
  return {
    id: `${canvasId}Target`,
    afterDraw(chart) {
      if (chart.canvas.id !== canvasId) return;
      const { ctx, scales: { y } } = chart;
      const ty = y.getPixelForValue(targetValue);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.5;
      ctx.moveTo(chart.chartArea.left, ty);
      ctx.lineTo(chart.chartArea.right, ty);
      ctx.stroke();
      ctx.restore();
    },
  };
}

// Generic per-repo P75 bar chart — used for Cycle Time, First Review, and PR
// Size so all three share one implementation instead of near-duplicates.
export function PRRepoBarChart({ repos, metricKey, axisLabel, unit, decimals = 1, breaching, close, chartId }) {
  // Sorted independently by its own metric, worst (highest) first
  const { labels, data } = useMemo(() => {
    if (!repos?.length) return { labels: [], data: [] };
    const sorted = [...repos].sort((a, b) => b[metricKey] - a[metricKey]);
    return {
      labels: sorted.map((r) => r.repo),
      data: sorted.map((r) => r[metricKey]),
    };
  }, [repos, metricKey]);

  const dataset = {
    data,
    backgroundColor: data.map((v) => repoColor(v, breaching, close)),
    borderWidth: 0,
    borderRadius: 3,
  };

  const targetPlugin = useMemo(() => makeTargetLinePlugin(chartId, breaching), [chartId, breaching]);
  const labelsPlugin = useMemo(
    () => makeTopValueLabelsPlugin(`${chartId}Labels`, unit, decimals),
    [chartId, unit, decimals]
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // Extra headroom so the value labels above the tallest bar aren't clipped
    layout: { padding: { top: 24 } },
    // Show the tooltip when hovering anywhere in the column, not only on the bar itself
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_DEFAULTS,
        callbacks: {
          label: (item) => `  ${item.parsed.y.toFixed(decimals)}${unit}`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 11 }, maxRotation: 35 }, grid: { display: false } },
      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: { font: { size: 10 }, callback: (v) => `${v}${unit}` },
        title: { display: true, text: axisLabel, font: { size: 11 }, color: '#8896b0' },
      },
    },
  };

  if (!repos?.length) {
    return <div className="text-[#8896b0] text-sm py-8 text-center">No repo data available.</div>;
  }

  return (
    <div style={{ position: 'relative', height: 220 }}>
      <Bar
        data={{ labels, datasets: [dataset] }}
        options={options}
        plugins={[targetPlugin, labelsPlugin]}
        id={chartId}
      />
    </div>
  );
}
