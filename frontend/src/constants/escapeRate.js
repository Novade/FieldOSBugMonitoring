// Same value as BacklogTable's JIRA_BASE; kept separate so the backlog isn't touched.
export const JIRA_BASE = 'https://novade.atlassian.net/browse';

export const SCOPE_LABELS = {
  prod: 'Bugs after prod',
  test: 'Bugs during testing',
  total: 'Total bugs',
};

export const SOURCE_PILL = {
  prod: { label: 'Prod', className: 'bg-[#fdecea] text-[#c0392b]' },
  test: { label: 'Testing', className: 'bg-[#eef2fb] text-brand' },
};
