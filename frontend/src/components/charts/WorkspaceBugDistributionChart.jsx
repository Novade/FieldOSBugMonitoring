import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';
import { makeDonutValueLabelsPlugin } from '../../utils/chartPlugins';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  '#3b6cb7', '#c0392b', '#2e7d5e', '#e67e22',
  '#6d28d9', '#0891b2', '#7a0000', '#047857', '#94a3b8',
];

const donutValueLabels = makeDonutValueLabelsPlugin('donutValueLabels');

export function WorkspaceBugDistributionChart({ issues, onSelectWorkspace }) {
  const { labels, datasets } = useMemo(() => {
    const counts = {};
    issues.forEach((b) => {
      if (!b.w?.length) return;
      b.w.forEach((ws) => { counts[ws] = (counts[ws] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 8);
    const othersTotal = sorted.slice(8).reduce((sum, [, v]) => sum + v, 0);
    if (othersTotal > 0) top.push(['Others', othersTotal]);
    const total = top.reduce((sum, [, v]) => sum + v, 0);
    return {
      labels: top.map(([name]) => name),
      datasets: [{
        data: top.map(([, v]) => v),
        backgroundColor: top.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
        _total: total,
      }],
    };
  }, [issues]);

  const total = datasets[0]?._total ?? 0;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_DEFAULTS,
        callbacks: {
          label: (item) => {
            const pct = total > 0 ? ((item.parsed / total) * 100).toFixed(1) : 0;
            return `  ${item.label}: ${item.parsed} (${pct}%)`;
          },
        },
      },
    },
    onClick: (_, els) => {
      if (!els?.length || !onSelectWorkspace) return;
      const name = labels[els[0].index];
      if (name !== 'Others') onSelectWorkspace(name);
    },
  };

  return (
    <div className="flex flex-col items-center h-full">
      <div style={{ position: 'relative', height: 200, width: 200 }}>
        <Doughnut data={{ labels, datasets }} options={options} plugins={[donutValueLabels]} />
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
        {labels.map((name, i) => (
          <span key={name} className="flex items-center gap-1 text-[11px] text-[#4a5568]">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
