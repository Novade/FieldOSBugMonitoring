import { useMemo } from 'react';
import { PORDER, PC } from '../../constants/jira';
import { isOpen } from '../../utils/issueUtils';
import { StackedBarChart } from './StackedBarChart';

export function AssigneeWorkloadChart({ issues, onDrillTo }) {
  const { labels, series } = useMemo(() => {
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

    return {
      labels: assignees,
      series: PORDER.map((p) => ({
        label: p,
        data: assignees.map(
          (name) => openBugs.filter((b) => b.a === name && b.p === p).length
        ),
        color: PC[p],
      })),
    };
  }, [issues]);

  return (
    <StackedBarChart
      id="cWorkload"
      labels={labels}
      series={series}
      onBarClick={(i) => onDrillTo('assignee_open', labels[i], `Open — ${labels[i]}`)}
    />
  );
}
