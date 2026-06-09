import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { PORDER, PC, DEPLOY_TARGETS } from '../../constants/jira';
import { med, workingDays } from '../../utils/dateUtils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export function DeploymentTimeChart({ issues }) {
  const { labels, datasets, targetValues } = useMemo(() => {
    const dm = {};
    PORDER.forEach((p) => (dm[p] = []));
    issues.filter((b) => b.d && b.c).forEach((b) => {
      const days = workingDays(b.c, b.d);
      if (!isNaN(days) && dm[b.p]) dm[b.p].push(days);
    });
    const deployData = PORDER.map((p) => {
      const m = med(dm[p]);
      return m === null ? null : +m.toFixed(1);
    });
    return {
      labels: PORDER,
      datasets: [{ label: 'Median days', data: deployData, backgroundColor: PORDER.map((p) => PC[p] + 'bb'), borderWidth: 0, borderRadius: 3 }],
      targetValues: PORDER.map((p) => DEPLOY_TARGETS[p]),
    };
  }, [issues]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
      deployTargets: {},
    },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } },
    interaction: { mode: 'index', intersect: false },
    deployTargets: targetValues,
  };

  return (
    <div style={{ position: 'relative', height: 220 }}>
      <Bar data={{ labels, datasets }} options={options} id="cDeploy" />
    </div>
  );
}
