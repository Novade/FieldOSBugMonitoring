import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card } from '../common/Card';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const THRESHOLDS = {
  cycleTime: { breaching: 24, close: 18 },
  firstReview: { breaching: 4, close: 3 },
  prSize: { breaching: 200 },
};

function repoColor(value, thresholds) {
  if (value > thresholds.breaching) return '#c0392b';
  if (thresholds.close != null && value > thresholds.close) return '#d97706';
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

// Dashed horizontal line marking the breaching threshold for a given chart
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

function barOptions(yLabel, unit) {
  return {
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
          label: (item) => `  ${item.parsed.y.toFixed(1)}${unit}`,
        },
      },
    },
    scales: {
      x: { ticks: { font: { size: 11 }, maxRotation: 35 }, grid: { display: false } },
      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: { font: { size: 10 }, callback: (v) => `${v}${unit}` },
        title: { display: true, text: yLabel, font: { size: 11 }, color: '#8896b0' },
      },
    },
  };
}

export function PRByRepoTab({ repos }) {
  // Each chart is sorted independently by its own metric, worst (highest) first
  const { cycle, review, size } = useMemo(() => {
    const sortBy = (key) =>
      [...(repos || [])].sort((a, b) => b[key] - a[key]);
    const cycleSorted = sortBy('cycleTime_p75');
    const reviewSorted = sortBy('firstReview_p75');
    const sizeSorted = sortBy('prSize_p75');
    return {
      cycle: {
        labels: cycleSorted.map((r) => r.repo),
        data: cycleSorted.map((r) => r.cycleTime_p75),
      },
      review: {
        labels: reviewSorted.map((r) => r.repo),
        data: reviewSorted.map((r) => r.firstReview_p75),
      },
      size: {
        labels: sizeSorted.map((r) => r.repo),
        data: sizeSorted.map((r) => r.prSize_p75),
      },
    };
  }, [repos]);

  const cycleDataset = {
    data: cycle.data,
    backgroundColor: cycle.data.map((v) => repoColor(v, THRESHOLDS.cycleTime)),
    borderWidth: 0,
    borderRadius: 3,
  };

  const reviewDataset = {
    data: review.data,
    backgroundColor: review.data.map((v) => repoColor(v, THRESHOLDS.firstReview)),
    borderWidth: 0,
    borderRadius: 3,
  };

  const sizeDataset = {
    data: size.data,
    backgroundColor: size.data.map((v) => repoColor(v, THRESHOLDS.prSize)),
    borderWidth: 0,
    borderRadius: 3,
  };

  // Dashed target-line annotation, reused across all three charts
  const cycleTargetPlugin = useMemo(() => makeTargetLinePlugin('prCycleBar', THRESHOLDS.cycleTime.breaching), []);
  const reviewTargetPlugin = useMemo(() => makeTargetLinePlugin('prReviewBar', THRESHOLDS.firstReview.breaching), []);
  const sizeTargetPlugin = useMemo(() => makeTargetLinePlugin('prSizeBar', THRESHOLDS.prSize.breaching), []);

  const cycleLabelsPlugin = useMemo(() => makeTopValueLabelsPlugin('prCycleLabels', 'h', 1), []);
  const reviewLabelsPlugin = useMemo(() => makeTopValueLabelsPlugin('prReviewLabels', 'h', 1), []);
  const sizeLabelsPlugin = useMemo(() => makeTopValueLabelsPlugin('prSizeLabels', '', 0), []);

  const legendItems = [
    { color: '#c0392b', label: 'Breaching' },
    { color: '#d97706', label: 'Close' },
    { color: '#2e7d5e', label: 'Compliant' },
  ];

  if (!repos?.length) {
    return (
      <div className="text-[#8896b0] text-sm py-8 text-center">No repo data available.</div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 max-[800px]:grid-cols-1 gap-4">
        <Card accent="blue" title="Cycle Time (P75)" subtitle={`Hours — last 30 days — dashed line = ${THRESHOLDS.cycleTime.breaching}h target`}>
          <div style={{ position: 'relative', height: 220 }}>
            <Bar
              data={{ labels: cycle.labels, datasets: [cycleDataset] }}
              options={barOptions('Hours', 'h')}
              plugins={[cycleTargetPlugin, cycleLabelsPlugin]}
              id="prCycleBar"
            />
          </div>
        </Card>
        <Card accent="teal" title="First Review Time (P75)" subtitle={`Hours — last 30 days — dashed line = ${THRESHOLDS.firstReview.breaching}h target`}>
          <div style={{ position: 'relative', height: 220 }}>
            <Bar
              data={{ labels: review.labels, datasets: [reviewDataset] }}
              options={barOptions('Hours', 'h')}
              plugins={[reviewTargetPlugin, reviewLabelsPlugin]}
              id="prReviewBar"
            />
          </div>
        </Card>
      </div>

      <Card accent="amber" title="PR Size (P75)" subtitle="Lines changed, excl. generated files — dashed line = 200 target">
        <div style={{ position: 'relative', height: 220 }}>
          <Bar
            data={{ labels: size.labels, datasets: [sizeDataset] }}
            options={barOptions('Lines', '')}
            plugins={[sizeTargetPlugin, sizeLabelsPlugin]}
            id="prSizeBar"
          />
        </div>
      </Card>

      <div className="flex gap-4 justify-end">
        {legendItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[12px] text-[#6b7a99]">
            <span
              className="inline-block w-3 h-3 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}
