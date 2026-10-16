// Azure DevOps pipelines shown on the Deployments page. Pipelines are matched by
// name inside each project; `group` is the card/column the run counts under.
// `environment` is the Azure DevOps Environment the pipeline deploys to. Its
// deployment history outlives run retention, so it backfills older months.
const PIPELINES = [
  { group: 'Web', project: 'NovadeLite Web', pipeline: 'Deploy to Staging', environment: 'staging', env: 'staging' },
  { group: 'Web', project: 'NovadeLite Web', pipeline: 'Deploy to Production', environment: 'production', env: 'prod' },
  { group: 'Backend', project: 'NovadeLiteBackend', pipeline: 'Deploy to Staging', environment: 'staging', env: 'staging' },
  { group: 'Backend', project: 'NovadeLiteBackend', pipeline: 'Deploy to Production', environment: 'production', env: 'prod' },
  { group: 'Report Export', project: 'NovadeLiteBackendServices', pipeline: 'ReportExportService Staging', env: 'staging' },
  { group: 'Report Export', project: 'NovadeLiteBackendServices', pipeline: 'ReportExportService Production', env: 'prod' },
  { group: 'Mobile', platform: 'iOS', project: 'NovadeLite Mobile', pipeline: 'iOS Staging', environment: 'ios-staging', env: 'staging' },
  { group: 'Mobile', platform: 'iOS', project: 'NovadeLite Mobile', pipeline: 'iOS Production', environment: 'ios-production', env: 'prod' },
  { group: 'Mobile', platform: 'Android', project: 'NovadeLite Mobile', pipeline: 'Android Staging', environment: 'android-staging', env: 'staging' },
  { group: 'Mobile', platform: 'Android', project: 'NovadeLite Mobile', pipeline: 'Android Production', environment: 'android-production', env: 'prod' },
];

module.exports = {
  PIPELINES,
  // Completed runs fetched per pipeline on each sync; more than any retention window holds.
  RUNS_PER_PIPELINE: 200,
  // Azure DevOps' default run retention. For pipelines without an environment, months
  // that started more than this many days before the first sync may be missing runs.
  RETENTION_DAYS: 30,
  // Environment history only changes by adding the runs a sync already gets from
  // the runs list, so it's re-read at most once a day.
  ENVIRONMENT_CACHE_TTL: 24 * 60 * 60 * 1000,
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
