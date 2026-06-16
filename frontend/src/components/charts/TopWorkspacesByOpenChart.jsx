import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { isOpen } from '../../utils/issueUtils';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';
import { makeBarValueLabelsPlugin } from '../../utils/chartPlugins';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const barValueLabels = makeBarValueLabelsPlugin('barValueLabelsOpen');

export function TopWorkspacesByOpenChart({ issues, onSelectWorkspace }) {
  const { labels, datasets } = useMemo(() => {
    const counts = {};
    issues.filter(isOpen).forEach((b) => {
      if (!b.w?.length) return;
      b.w.forEach((ws) => { counts[ws] = (counts[ws] || 0) + 1; });
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
    <div style={{ position: 'relative', height: '100%' }}>
      <Bar data={{ labels, datasets }} options={options} plugins={[barValueLabels]} />
    </div>
  );
}
