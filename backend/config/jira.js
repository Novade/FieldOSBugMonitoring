module.exports = {
  BUGS_JQL: "project = NL AND issuetype = Bug AND created >= '2026-01-01' ORDER BY created DESC",
  REGRESSIONS_JQL: "project = NL AND issuetype = \"Regression Bug\" AND created >= '2026-01-01' ORDER BY created DESC",

  FIELDS: [
    'summary',
    'status',
    'priority',
    'assignee',
    'created',
    'resolutiondate',
    'customfield_10733', // Deployment Date
  ],

  PAGE_SIZE: 100,
};
