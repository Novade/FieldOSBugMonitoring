require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const REQUIRED = [
  'ATLASSIAN_CLIENT_ID',
  'ATLASSIAN_CLIENT_SECRET',
  'ATLASSIAN_CALLBACK_URL',
  'JIRA_BASE_URL',
  'JIRA_CLOUD_ID',
  'JIRA_USER_EMAIL',
  'JIRA_API_TOKEN',
  'SESSION_SECRET',
];

const missing = REQUIRED.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`[config] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[config] Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

module.exports = {
  atlassian: {
    clientId: process.env.ATLASSIAN_CLIENT_ID,
    clientSecret: process.env.ATLASSIAN_CLIENT_SECRET,
    callbackUrl: process.env.ATLASSIAN_CALLBACK_URL,
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    resourcesUrl: 'https://api.atlassian.com/oauth/token/accessible-resources',
  },
  jira: {
    baseUrl: process.env.JIRA_BASE_URL,
    cloudId: process.env.JIRA_CLOUD_ID,
    userEmail: process.env.JIRA_USER_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
  },
  session: {
    secret: process.env.SESSION_SECRET,
  },
  port: parseInt(process.env.PORT || '3001', 10),
  isDev: process.env.NODE_ENV !== 'production',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
