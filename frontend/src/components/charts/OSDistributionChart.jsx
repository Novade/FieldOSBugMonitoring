import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { OS_ALL } from '../../utils/fieldUtils';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';
import { makeDonutValueLabelsPlugin } from '../../utils/chartPlugins';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#c0392b', '#6d28d9', '#047857', '#0891b2', '#e67e22'];

const donutValueLabels = makeDonutValueLabelsPlugin('osDonutValueLabels');

export function OSDistributionChart({ issues, onDrillTo }) {
  const { labels, datasets } = useMemo(() => {
    const counts = {};
    issues.forEach((b) => {
      b.os?.forEach((o) => {
        if (OS_ALL.includes(o)) counts[o] = (counts[o] || 0) + 1;
      });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((sum, [, v]) => sum + v, 0);
    return {
      labels: sorted.map(([name]) => name),
      datasets: [
        {
          data: sorted.map(([, v]) => v),
          backgroundColor: sorted.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6,
          _total: total,
        },
      ],
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
            const pct =
              total > 0 ? ((item.parsed / total) * 100).toFixed(1) : 0;
            return `  ${item.label}: ${item.parsed} (${pct}%)`;
          },
        },
      },
    },
    onClick: (_, els) => {
      if (!els?.length || !onDrillTo) return;
      const name = labels[els[0].index];
      onDrillTo('os', name);
    },
  };

  if (labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[160px]">
        <p className="text-[13px] text-[#8896b0]">No OS data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full">
      <div style={{ position: 'relative', height: 200, width: 200 }}>
        <Doughnut
          data={{ labels, datasets }}
          options={options}
          plugins={[donutValueLabels]}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-3">
        {labels.map((name, i) => (
          <span
            key={name}
            className="flex items-center gap-1 text-[11px] text-[#4a5568]"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            {name}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-[#a0aab8] mt-2 italic">
        * Issues with multiple platforms are counted in each applicable OS.
      </p>
    </div>
  );
}
