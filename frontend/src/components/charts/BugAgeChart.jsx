import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { isOpen } from '../../utils/issueUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AGE_BUCKETS = ['0–7 days', '8–30 days', '31–60 days', '60+ days'];
const AGE_COLORS = ['#2e7d5e', '#3b6cb7', '#e67e22', '#c0392b'];

export function BugAgeChart({ issues, onDrillTo }) {
  const { labels, datasets } = useMemo(() => {
    const today = new Date();
    const counts = [0, 0, 0, 0];
    issues.filter(isOpen).forEach((b) => {
      if (!b.c) return;
      const days = Math.floor((today - new Date(b.c + 'T00:00:00')) / 86400000);
      if (isNaN(days)) return;
      const idx = days <= 7 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : 3;
      counts[idx]++;
    });
    return {
      labels: AGE_BUCKETS,
      datasets: [{ label: 'Open bugs', data: counts, backgroundColor: AGE_COLORS, borderWidth: 0, borderRadius: 4 }],
    };
  }, [issues]);

  const maxVal = Math.max(...(datasets[0]?.data || [0]), 1);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
      y: { beginAtZero: true, max: maxVal + 1, ticks: { font: { size: 11 }, stepSize: 1, precision: 0 } },
    },
    interaction: { mode: 'index', intersect: false },
    onClick: (_, els) => {
      if (els?.length) {
        onDrillTo('age', els[0].index, `Open bugs — ${AGE_BUCKETS[els[0].index]}`);
      }
    },
  };

  return (
    <div style={{ position: 'relative', height: 210 }}>
      <Bar data={{ labels, datasets }} options={options} />
    </div>
  );
}
