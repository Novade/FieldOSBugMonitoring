import { useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { isResolved } from '../../utils/issueUtils';
import { ws, wl } from '../../utils/dateUtils';
import { ChartLegend } from './ChartLegend';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function CumulativeCreatedVsResolvedChart({ issues, onDrillTo }) {
  const chartRef = useRef(null);
  const resolved = useMemo(() => issues.filter(isResolved), [issues]);

  const { labels, datasets, weeks } = useMemo(() => {
    const aw = Array.from(new Set([
      ...issues.map((b) => ws(b.c)),
      ...resolved.map((b) => ws(b.r)),
    ])).sort();
    const wkC = {}; aw.forEach((w) => (wkC[w] = 0));
    issues.forEach((b) => { const w = ws(b.c); if (w in wkC) wkC[w]++; });
    const wkR = {}; aw.forEach((w) => (wkR[w] = 0));
    resolved.forEach((b) => { const w = ws(b.r); if (w in wkR) wkR[w]++; });

    let cc = 0, cr = 0;
    const cC = [], cR = [];
    aw.forEach((w, i) => { cc += wkC[w]; cr += wkR[w]; cC.push(cc); cR.push(cr); });

    return {
      weeks: aw,
      labels: aw.map(wl),
      datasets: [
        { label: 'Created', data: cC, borderColor: '#2563eb', backgroundColor: 'transparent', pointRadius: 2, borderWidth: 2, tension: 0.3 },
        { label: 'Resolved', data: cR, borderColor: '#16a34a', backgroundColor: 'transparent', pointRadius: 2, borderWidth: 2, tension: 0.3, borderDash: [5, 3] },
      ],
    };
  }, [issues, resolved]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { title: (items) => `Week of ${items[0].label}` } } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: false } } },
    interaction: { mode: 'index', intersect: false },
    onClick: (_, els) => {
      if (!els?.length) return;
      const { index, datasetIndex } = els[0];
      const w = weeks[index];
      onDrillTo(
        datasetIndex === 0 ? 'cum_c' : 'cum_r',
        w,
        `${datasetIndex === 0 ? 'Created' : 'Resolved'} — up to week of ${labels[index]}`
      );
    },
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
