import { useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { PORDER, PC } from '../../constants/jira';
import { ws, wl } from '../../utils/dateUtils';
import { ChartLegend } from './ChartLegend';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function WeeklyPriorityChart({ issues, onDrillTo }) {
  const chartRef = useRef(null);

  const { labels, datasets, weeks } = useMemo(() => {
    if (!issues.length) return { labels: [], datasets: [], weeks: [] };

    // Build a full week range from the earliest created date to today, no gaps
    const firstWeek = issues.map((b) => ws(b.c)).sort()[0];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayWeek = ws(todayStr);
    const wks = [];
    const cur = new Date(firstWeek + 'T00:00:00');
    const end = new Date(todayWeek + 'T00:00:00');
    while (cur <= end) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      wks.push(`${yyyy}-${mm}-${dd}`);
      cur.setDate(cur.getDate() + 7);
    }

    const wp = {};
    PORDER.forEach((p) => {
      wp[p] = {};
      wks.forEach((w) => (wp[p][w] = 0));
    });
    issues.forEach((b) => {
      const w = ws(b.c);
      if (wp[b.p] && w in wp[b.p]) wp[b.p][w]++;
    });

    return {
      weeks: wks,
      labels: wks.map(wl),
      datasets: PORDER.map((p) => ({
        label: p,
        data: wks.map((w) => wp[p][w]),
        borderColor: PC[p],
        backgroundColor: 'transparent',
        pointRadius: 3,
        pointBackgroundColor: PC[p],
        borderWidth: 2,
        tension: 0.3,
        borderDash: p === 'Lowest' ? [5, 4] : p === 'Low' ? [3, 2] : [],
      })),
    };
  }, [issues]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: { title: (items) => `Week of ${items[0].label}` },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 11 } } },
      x: { ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: false } },
    },
    interaction: { mode: 'index', intersect: false },
    onClick: onDrillTo
      ? (_, els) => {
          if (!els?.length) return;
          const { index, datasetIndex } = els[0];
          const priority = PORDER[datasetIndex];
          const week = weeks[index];
          const label = labels[index];
          onDrillTo('week_c', week, `${priority} — week of ${label}`);
        }
      : undefined,
  };

  return (
    <>
      <div style={{ position: 'relative', height: 250 }}>
        <Line ref={chartRef} data={{ labels, datasets }} options={options} />
      </div>
      <ChartLegend datasets={datasets} chartRef={chartRef} />
    </>
  );
}
