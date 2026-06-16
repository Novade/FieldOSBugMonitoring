import { useMemo, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { TOOLTIP_DEFAULTS } from '../../constants/chartDefaults';
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
        caretSize: 5,
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
