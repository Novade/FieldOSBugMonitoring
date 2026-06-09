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
import { isOpen } from '../../utils/issueUtils';
import { ChartLegend } from './ChartLegend';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  caretSize: 5,
};

export function AssigneeWorkloadChart({ issues, onDrillTo }) {
  const chartRef = useRef(null);

  const { labels, datasets } = useMemo(() => {
    const openBugs = issues.filter(isOpen);
    const allAssignees = [...new Set(openBugs.map((b) => b.a))];
    const others = allAssignees
      .filter((n) => n !== 'Unassigned')
      .sort(
        (x, y) =>
          openBugs.filter((b) => b.a === y).length -
          openBugs.filter((b) => b.a === x).length
      );
    const assignees = allAssignees.includes('Unassigned')
      ? ['Unassigned', ...others]
      : others;

    const wlData = {};
    PORDER.forEach((p) => {
      wlData[p] = assignees.map(
        (name) => openBugs.filter((b) => b.a === name && b.p === p).length
      );
    });

    return {
      labels: assignees,
      datasets: PORDER.map((p) => ({
        label: p,
        data: wlData[p],
        backgroundColor: PC[p] + 'cc',
        borderWidth: 0,
        borderRadius: 3,
      })),
    };
  }, [issues]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...TOOLTIP_DEFAULTS,
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (item) =>
            item.parsed.y == null
              ? null
              : `  ${item.dataset.label}: ${item.parsed.y}`,
        },
      },
    },
    scales: {
      x: { stacked: true, ticks: { font: { size: 11 }, maxRotation: 35 } },
      y: { stacked: true, beginAtZero: true, ticks: { font: { size: 10 } } },
    },
    interaction: { mode: 'index', intersect: false },
    onClick: (_, els) => {
      if (els?.length) {
        const assignee = labels[els[0].index];
        onDrillTo('assignee_open', assignee, `Open — ${assignee}`);
      }
    },
  };

  return (
    <>
      <div style={{ position: 'relative', height: 260 }}>
        <Bar
          ref={chartRef}
          data={{ labels, datasets }}
          options={options}
          id="cWorkload"
        />
      </div>
      <ChartLegend datasets={datasets} chartRef={chartRef} />
    </>
  );
}
