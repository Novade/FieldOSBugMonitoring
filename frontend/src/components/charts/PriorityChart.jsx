import { useMemo, useRef } from 'react';
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
import { PORDER, PC } from '../../constants/jira';
import { isResolved } from '../../utils/issueUtils';
import { ChartLegend } from './ChartLegend';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function PriorityChart({ issues, onDrillTo }) {
  const chartRef = useRef(null);

  const { labels, datasets } = useMemo(() => {
    const resolved = issues.filter(isResolved);
    const pC = {};
    const pR = {};
    PORDER.forEach((p) => {
      pC[p] = 0;
      pR[p] = 0;
    });
    issues.forEach((b) => {
      if (pC[b.p] !== undefined) pC[b.p]++;
    });
    resolved.forEach((b) => {
      if (pR[b.p] !== undefined) pR[b.p]++;
    });
    return {
      labels: PORDER,
      datasets: [
        {
          label: 'Created',
          data: PORDER.map((p) => pC[p]),
          backgroundColor: PORDER.map((p) => PC[p] + 'cc'),
          borderWidth: 0,
          borderRadius: 3,
        },
        {
          label: 'Resolved',
          data: PORDER.map((p) => pR[p]),
          backgroundColor: PORDER.map((p) => PC[p] + '44'),
          borderColor: PORDER.map((p) => PC[p]),
          borderWidth: 1.5,
          borderRadius: 3,
        },
      ],
    };
  }, [issues]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { font: { size: 11 } } },
      x: { ticks: { font: { size: 11 } } },
    },
    interaction: { mode: 'index', intersect: false },
    onClick: (_, els) => {
      if (els?.length)
        onDrillTo('p', PORDER[els[0].index], PORDER[els[0].index]);
    },
  };

  return (
    <>
      <div style={{ position: 'relative', height: 210 }}>
        <Bar ref={chartRef} data={{ labels, datasets }} options={options} />
      </div>
      <ChartLegend datasets={datasets} chartRef={chartRef} />
    </>
  );
}
