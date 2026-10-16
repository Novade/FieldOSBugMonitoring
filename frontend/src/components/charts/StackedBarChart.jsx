import { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';
import { ChartLegend } from './ChartLegend';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Stacked bars with the app's tooltip style and clickable legend.
// `series` is [{ label, data, color }]; `onBarClick(index)` gets the clicked x index.
export function StackedBarChart({ id, labels, series, onBarClick, height = 260 }) {
  const chartRef = useRef(null);

  const datasets = series.map((s) => ({
    label: s.label,
    data: s.data,
    backgroundColor: s.color + 'cc',
    borderWidth: 0,
    borderRadius: 3,
  }));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_DEFAULTS,
        caretSize: 5,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (item) =>
            item.parsed.y == null ? null : `  ${item.dataset.label}: ${item.parsed.y}`,
        },
      },
    },
    scales: {
      x: { stacked: true, ticks: { font: { size: 11 }, maxRotation: 35 } },
      y: { stacked: true, beginAtZero: true, ticks: { font: { size: 10 } } },
    },
    interaction: { mode: 'index', intersect: false },
    onClick: (_, els) => {
      if (onBarClick && els?.length) onBarClick(els[0].index);
    },
  };

  return (
    <>
      <div style={{ position: 'relative', height }}>
        <Bar ref={chartRef} data={{ labels, datasets }} options={options} id={id} />
      </div>
      <ChartLegend datasets={datasets} chartRef={chartRef} />
    </>
  );
}
