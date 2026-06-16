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
    'customfield_10568', // Workspace Name
    'customfield_10577', // Region
    'customfield_10571', // Device / OS
  ],

  PAGE_SIZE: 100,
};
