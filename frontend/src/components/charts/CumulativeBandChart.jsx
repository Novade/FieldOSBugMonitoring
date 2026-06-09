import { useMemo, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { ws, wl } from '../../utils/dateUtils';
import { ChartLegend } from './ChartLegend';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function CumulativeBandChart({ issues }) {
  const chartRef = useRef(null);

  const { labels, datasets } = useMemo(() => {
    const wks = Array.from(new Set(issues.map((b) => ws(b.c)))).sort();
    const wp = { Highest: {}, High: {}, Medium: {}, Low: {}, Lowest: {} };
    Object.keys(wp).forEach((p) => wks.forEach((w) => (wp[p][w] = 0)));
    issues.forEach((b) => { const w = ws(b.c); if (wp[b.p] && w in wp[b.p]) wp[b.p][w]++; });

    let ch = 0, chh = 0, chhm = 0, cl = 0, clo = 0;
    const b1 = [], b2 = [], b3 = [], b4 = [];
    wks.forEach((w) => {
      ch += wp.Highest[w] || 0; chh += wp.High[w] || 0; chhm += wp.Medium[w] || 0; cl += wp.Low[w] || 0; clo += wp.Lowest[w] || 0;
      b1.push(ch); b2.push(ch + chh); b3.push(ch + chh + chhm); b4.push(ch + chh + chhm + cl + clo);
    });

    return {
      labels: wks.map(wl),
      datasets: [
        { label: 'Highest', data: b1, borderColor: '#7a0000', backgroundColor: 'transparent', pointRadius: 2, borderWidth: 2, tension: 0.3 },
        { label: 'Highest + High', data: b2, borderColor: '#e05c5c', backgroundColor: 'transparent', pointRadius: 2, borderWidth: 2, tension: 0.3, borderDash: [6, 3] },
        { label: 'Highest + High + Medium', data: b3, borderColor: '#1ab394', backgroundColor: 'transparent', pointRadius: 2, borderWidth: 2, tension: 0.3, borderDash: [3, 2] },
        { label: 'All priorities', data: b4, borderColor: '#9b59b6', backgroundColor: 'transparent', pointRadius: 2, borderWidth: 2, tension: 0.3 },
      ],
    };
  }, [issues]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false, callbacks: { title: (items) => `Week of ${items[0].label}` } } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 10 }, maxRotation: 45, autoSkip: false } } },
    interaction: { mode: 'index', intersect: false },
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
