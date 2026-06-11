const axios = require('axios');
const config = require('../config/env');
const jiraConfig = require('../config/jira');
const { transformIssue, extractWorkspaceName } = require('../models/issueModel');

const basicAuth = Buffer.from(
  `${config.jira.userEmail}:${config.jira.apiToken}`
).toString('base64');

const jiraClient = axios.create({
  baseURL: `${config.jira.baseUrl}/rest/api/3`,
  headers: {
    Authorization: `Basic ${basicAuth}`,
    Accept: 'application/json',
  },
});

// Attach Jira error flag so the error handler can give a better message
jiraClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response) {
      const jiraErr = new Error(
        err.response.data?.errorMessages?.[0] || err.response.data?.message || err.message
      );
      jiraErr.isJiraError = true;
      jiraErr.status = err.response.status;
      jiraErr.statusCode = err.response.status;
      return Promise.reject(jiraErr);
    }
    // Network / DNS error
    const netErr = new Error(
      `Cannot reach Jira at ${config.jira.baseUrl}. Check JIRA_BASE_URL and your network connection.`
    );
    netErr.isJiraError = true;
    netErr.status = 503;
    return Promise.reject(netErr);
  }
);

async function fetchAllIssues(jql) {
  const allIssues = [];
  let nextPageToken = undefined;

  while (true) {
    const params = {
      jql,
      fields: jiraConfig.FIELDS.join(','),
      maxResults: jiraConfig.PAGE_SIZE,
    };
    if (nextPageToken) params.nextPageToken = nextPageToken;

    const res = await jiraClient.get('/search/jql', { params });
    const { issues, isLast, nextPageToken: token } = res.data;

    for (const issue of issues) {
      allIssues.push(transformIssue(issue));
    }

    if (isLast || !token || !issues.length) break;
    nextPageToken = token;
  }

  return allIssues;
}

async function getBugs(req, res, next) {
  try {
    const issues = await fetchAllIssues(jiraConfig.BUGS_JQL);
    console.log(`[jira] Fetched ${issues.length} bugs`);
    res.json({ issues, fetchedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function getRegressions(req, res, next) {
  try {
    const issues = await fetchAllIssues(jiraConfig.REGRESSIONS_JQL);
    console.log(`[jira] Fetched ${issues.length} regression bugs`);
    res.json({ issues, fetchedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
}

async function getWorkspaceNames(req, res, next) {
  try {
    const seen = new Set();
    let nextPageToken = undefined;

    while (true) {
      const params = {
        jql: jiraConfig.BUGS_JQL,
        fields: 'customfield_10568',
        maxResults: jiraConfig.PAGE_SIZE,
      };
      if (nextPageToken) params.nextPageToken = nextPageToken;

      const response = await jiraClient.get('/search/jql', { params });
      const { issues, isLast, nextPageToken: token } = response.data;

      for (const issue of issues) {
        const raw = issue.fields?.customfield_10568;
        const name = extractWorkspaceName(raw);
        if (name) seen.add(name);
      }

      if (isLast || !token || !issues.length) break;
      nextPageToken = token;
    }

    const workspaces = Array.from(seen).sort((a, b) => a.localeCompare(b));
    console.log(`[jira] Fetched ${workspaces.length} workspace names`);
    res.json({ workspaces });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBugs, getRegressions, getWorkspaceNames };
