import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  '#3b6cb7', '#c0392b', '#2e7d5e', '#e67e22',
  '#6d28d9', '#0891b2', '#7a0000', '#047857', '#94a3b8',
];

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

const donutValueLabels = {
  id: 'donutValueLabels',
  afterDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      chart.getDatasetMeta(i).data.forEach((arc, index) => {
        const value = dataset.data[index];
        if (!value) return;
        const angle = arc.endAngle - arc.startAngle;
        if (angle < 0.3) return; // skip slices too small to fit text
        const midAngle = arc.startAngle + angle / 2;
        const r = (arc.outerRadius + arc.innerRadius) / 2;
        const x = arc.x + r * Math.cos(midAngle);
        const y = arc.y + r * Math.sin(midAngle);
        ctx.save();
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, x, y);
        ctx.restore();
      });
    });
  },
};

export function WorkspaceBugDistributionChart({ issues, onSelectWorkspace }) {
  const { labels, datasets } = useMemo(() => {
    const counts = {};
    issues.forEach((b) => {
      if (!b.w) return;
      counts[b.w] = (counts[b.w] || 0) + 1;
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
