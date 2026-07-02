module.exports = {
  apiBase: 'https://api.github.com',
  repos: [
    'NovadeLite',
    'NovadeLiteBackend',
    'NovadeLiteBackendServices',
    'lite-signup',
    'DrawingUploadService',
    'TemplateLibraryFrontEnd',
    'TemplateLibraryBackend',
  ],
  excludedFilePatterns: [
    // Dart generated files
    /__generated__/,
    /\.g\.dart$/,
    /\.freezed\.dart$/,
    /\.gql\.dart$/,
    /\.ast\.gql\.dart$/,
    /\.data\.gql\.dart$/,
    // Lock files
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /pubspec\.lock$/,
    /Podfile\.lock$/,
    // Build outputs & bundles
    /^dist\//,
    /^build\//,
    /^\.next\//,
    /\.min\.js$/,
    /\.min\.css$/,
    // Large data / migration dumps
    /\.sql$/,
    /\.csv$/,
  ],
  thresholds: {
    cycleTime: { breaching: 24, close: 18 },  // hours
    firstReview: { breaching: 4, close: 3 },  // hours
    prSize: { breaching: 200 },               // lines
  },
  shardPattern: /Run tests on Ubuntu Shard-(\d+)/i,
  ciAppSlug: 'azure-pipelines',
  dataWindowDays: 30,
  trendWeeks: 8,
  cacheTtl: {
    // Lazy/on-demand refresh — only refetches when someone visits AND the
    // cache is older than this. GraphQL fetches are cheap (~50-100 rate
    // limit points out of 5,000/hour), so a short TTL is safe.
    historical: 15 * 60 * 1000,
    openPrs: 15 * 60 * 1000,
  },
};
