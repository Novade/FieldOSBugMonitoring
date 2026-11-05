// Same value as BacklogTable's JIRA_BASE; kept separate so the backlog isn't touched.
export const JIRA_BASE = 'https://novade.atlassian.net/browse';

export const SCOPE_LABELS = {
  prod: 'Bugs after prod',
  test: 'Bugs during testing',
  total: 'Total bugs',
};

export const SOURCE_PILL = {
  prod: { label: 'Prod', className: 'bg-danger-tint text-danger' },
  test: { label: 'Testing', className: 'bg-brand-tint text-brand' },
};
