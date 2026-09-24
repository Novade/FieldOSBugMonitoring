import { useMemo } from 'react';
import { PORDER } from '../../constants/jira';
import { REGION_ALL, OS_ALL } from '../../utils/fieldUtils';
import { FilterBar as GenericFilterBar } from '../common/FilterBar';

const FILTER_FIELDS = [
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'reg', label: 'Region' },
  { key: 'os', label: 'OS' },
];

const BOOLEAN_FILTERS = [
  { key: 'noActionDone', label: 'No Action Done' },
  { key: 'pendingDeployment', label: 'Validated, pending deployment' },
];

export function FilterBar({ issues, filters, onFilterChange, onClear, lockedField }) {
  const { statuses, assignees } = useMemo(() => {
    const st = [...new Set(issues.map((b) => b.st))].sort();
    const all = [...new Set(issues.map((b) => b.a))];
    const unassigned = all.includes('Unassigned') ? ['Unassigned'] : [];
    const named = all.filter((a) => a !== 'Unassigned').sort();
    return { statuses: st, assignees: [...unassigned, ...named] };
  }, [issues]);

  const fieldOptions = {
    priority: PORDER.filter((p) => issues.some((b) => b.p === p)),
    status: statuses,
    assignee: assignees,
    reg: REGION_ALL,
    os: OS_ALL,
  };

  return (
    <div className="mb-3.5">
      <GenericFilterBar
        fields={FILTER_FIELDS}
        fieldOptions={fieldOptions}
        filters={filters}
        onFilterChange={onFilterChange}
        onClear={onClear}
        lockedField={lockedField}
        booleanFilters={BOOLEAN_FILTERS}
        searchable
        searchPlaceholder="Search key or summary..."
      />
    </div>
  );
}
