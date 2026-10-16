// Azure DevOps pipelines shown on the Deployments page. Pipelines are matched by
// exact name inside each project; `group` is the card/column the run counts under.
const PIPELINES = [
  { group: 'Web', project: 'NovadeLite Web', pipeline: 'Deploy to Staging', env: 'staging' },
  { group: 'Web', project: 'NovadeLite Web', pipeline: 'Deploy to Production', env: 'prod' },
  { group: 'Backend', project: 'NovadeLiteBackend', pipeline: 'Deploy to Staging', env: 'staging' },
  { group: 'Backend', project: 'NovadeLiteBackend', pipeline: 'Deploy to Production', env: 'prod' },
  { group: 'Report Export', project: 'NovadeLiteBackendServices', pipeline: 'ReportExportService Staging', env: 'staging' },
  { group: 'Report Export', project: 'NovadeLiteBackendServices', pipeline: 'ReportExportService Production', env: 'prod' },
  { group: 'Mobile', platform: 'iOS', project: 'NovadeLite Mobile', pipeline: 'IOS Staging', env: 'staging' },
  { group: 'Mobile', platform: 'iOS', project: 'NovadeLite Mobile', pipeline: 'IOS Production', env: 'prod' },
  { group: 'Mobile', platform: 'Android', project: 'NovadeLite Mobile', pipeline: 'Android Staging', env: 'staging' },
  { group: 'Mobile', platform: 'Android', project: 'NovadeLite Mobile', pipeline: 'Android Production', env: 'prod' },
];

module.exports = {
  PIPELINES,
  // Completed runs fetched per pipeline on each sync; more than any retention window holds.
  RUNS_PER_PIPELINE: 200,
  // Azure DevOps' default run retention. Months that started more than this many days
  // before the first sync may be missing runs that were already deleted.
  RETENTION_DAYS: 30,
  TIME_ZONE: 'Asia/Singapore',
  SYNC_CACHE_TTL: 5 * 60 * 1000,
  SYNC_INTERVAL: 6 * 60 * 60 * 1000,
  // Runs are stored as a JSON file on the same GitHub data branch as escape rates
  // (never main, so a sync doesn't trigger the Azure deploy pipeline).
  storage: {
    repo: 'FieldOSBugMonitoring',
    path: 'deployments.json',
    branch: process.env.DEPLOYMENT_DATA_BRANCH || process.env.ESCAPE_RATE_DATA_BRANCH || 'escape-rate-data',
  },
};
