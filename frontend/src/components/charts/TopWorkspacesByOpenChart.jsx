import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { isOpen } from '../../utils/issueUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TOOLTIP_DEFAULTS = {
  backgroundColor: 'rgba(20,35,65,.95)',
  titleColor: '#e2e5ed',
  bodyColor: '#c8ccda',
  borderColor: 'rgba(255,255,255,.12)',
  borderWidth: 1,
  padding: { top: 10, bottom: 10, left: 12, right: 12 },
  titleFont: { size: 12, weight: '600' },
  bodyFont: { size: 12 },
  cornerRadius: 8,
};

const barValueLabels = {
  id: 'barValueLabelsOpen',
  afterDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((bar, index) => {
        const value = dataset.data[index];
        if (!value) return;
        ctx.save();
        ctx.font = '600 10px sans-serif';
        ctx.fillStyle = '#4a5568';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, bar.x + 4, bar.y);
        ctx.restore();
      });
    });
  },
};

export function TopWorkspacesByOpenChart({ issues, onSelectWorkspace }) {
  const { labels, datasets } = useMemo(() => {
    const counts = {};
    issues.filter(isOpen).forEach((b) => {
      if (!b.w) return;
      counts[b.w] = (counts[b.w] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    return {
      labels: sorted.map(([name]) => name),
      datasets: [{
        label: 'Open Bugs',
        data: sorted.map(([, v]) => v),
        backgroundColor: '#d9770699',
        borderWidth: 0,
        borderRadius: 4,
      }],
    };
  }, [issues]);

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_DEFAULTS,
        callbacks: { label: (item) => `  Open: ${item.parsed.x}` },
      },
    },
    scales: {
      x: { beginAtZero: true, ticks: { font: { size: 10 }, precision: 0 } },
      y: { ticks: { font: { size: 11 } } },
    },
    layout: { padding: { right: 28 } },
    onClick: (_, els) => {
      if (els?.length && onSelectWorkspace) {
        onSelectWorkspace(labels[els[0].index]);
      }
    },
  };

  if (labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[160px]">
        <p className="text-[13px] text-[#2e7d5e] font-medium">No open bugs — all clear!</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: Math.max(labels.length * 30 + 20, 160) }}>
      <Bar data={{ labels, datasets }} options={options} plugins={[barValueLabels]} />
    </div>
  );
}
