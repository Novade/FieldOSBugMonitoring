export const PORDER = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];

export const PC = {
  Highest: '#7a0000',
  High: '#c0392b',
  Medium: '#e67e22',
  Low: '#2980b9',
  Lowest: '#5dade2',
};

export const OPEN_STATUSES = new Set(['To Do', 'In Progress', 'Code Review', 'Blocked', 'Failed']);
export const DEPLOY_STATUSES = new Set([
  'Pending Later Deployment',
  'Ready for Testing',
  'Testing',
  'Testing - UI',
]);

export const DEPLOY_TARGETS = { Highest: 1, High: 1, Medium: 14, Low: 30, Lowest: 30 };
export const DEPLOY_TARGET_LABELS = {
  Highest: '< 1 day',
  High: '1 day',
  Medium: '14 working days',
  Low: '30 working days',
  Lowest: '30 working days',
};

export const PSORT = { Highest: 0, High: 1, Medium: 2, Low: 3, Lowest: 4 };
