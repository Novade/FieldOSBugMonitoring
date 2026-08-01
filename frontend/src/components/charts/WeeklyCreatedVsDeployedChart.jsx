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
} from 'chart.js';
import { isDeployed, hasNoActionDoneLabel } from '../../utils/issueUtils';
import { ws, wl } from '../../utils/dateUtils';
import { ChartLegend } from './ChartLegend';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function WeeklyCreatedVsDeployedChart({ issues, onDrillTo }) {
  const chartRef = useRef(null);
  const deployed = useMemo(() => issues.filter(isDeployed), [issues]);
  const validCreated = useMemo(
    () => issues.filter((b) => !hasNoActionDoneLabel(b)),
    [issues]
  );
  const { labels, datasets, weeks } = useMemo(() => {
    const aw = Array.from(
      new Set([
        ...issues.map((b) => ws(b.c)),
        ...validCreated.map((b) => ws(b.c)),
        ...deployed.map((b) => ws(b.d)),
      ])
    ).sort();
    const wkC = {};
    aw.forEach((w) => (wkC[w] = 0));
    issues.forEach((b) => {
      const w = ws(b.c);
      if (w in wkC) wkC[w]++;
    });
    const wkV = {};
    aw.forEach((w) => (wkV[w] = 0));
    validCreated.forEach((b) => {
      const w = ws(b.c);
      if (w in wkV) wkV[w]++;
    });
    const wkD = {};
    aw.forEach((w) => (wkD[w] = 0));
    deployed.forEach((b) => {
      const w = ws(b.d);
      if (w in wkD) wkD[w]++;
    });
    const al = aw.map(wl);
    return {
      weeks: aw,
      labels: al,
      datasets: [
        {
          label: 'Created',
          data: aw.map((w) => wkC[w]),
          borderColor: '#d97706',
          backgroundColor: 'transparent',
          pointRadius: 3,
          pointHitRadius: 6,
          pointBackgroundColor: '#d97706',
          borderWidth: 1.7,
          tension: 0.3,
          borderDash: [2, 2],
        },
        {
          label: 'Created (valid)',
          data: aw.map((w) => wkV[w]),
          borderColor: '#2563eb',
          backgroundColor: 'transparent',
          pointRadius: 3,
          pointHitRadius: 6,
          pointBackgroundColor: '#2563eb',
          borderWidth: 2,
          tension: 0.3,
        },
        {
          label: 'Deployed',
          data: aw.map((w) => wkD[w]),
          borderColor: '#16a34a',
          backgroundColor: 'transparent',
          pointRadius: 3,
          pointHitRadius: 6,
          pointBackgroundColor: '#16a34a',
          borderWidth: 2,
          tension: 0.3,
          borderDash: [5, 3],
        },
      ],
    };
  }, [issues, validCreated, deployed]);

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
    interaction: { mode: 'point', intersect: true },
    onClick: (_, els) => {
      if (!els?.length) return;
      const { index, datasetIndex } = els[0];
      const w = weeks[index];
      const label = labels[index];
      const drillMap = [
        { key: 'week_c', name: 'Created' },
        { key: 'week_c_valid', name: 'Created (valid)' },
        { key: 'week_d', name: 'Deployed' },
      ];
      const { key, name } = drillMap[datasetIndex];
      onDrillTo(key, w, `${name} — week of ${label}`);
    },
  };

  return (
    <>
      <div style={{ position: 'relative', height: 250 }}>
        <Line ref={chartRef} data={{ labels, datasets }} options={options} />
      </div>
      <ChartLegend datasets={datasets} chartRef={chartRef} showTotals />
    </>
  );
}
