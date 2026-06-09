function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[error] ${req.method} ${req.path} — ${err.message}`);
  if (isDev && err.stack) console.error(err.stack);

  // Never expose stack traces or raw Jira errors to the client
  const message = resolveClientMessage(err, status);
  res.status(status).json({ error: message });
}

function resolveClientMessage(err, status) {
  if (err.isJiraError) {
    if (status === 401) return 'Jira authentication failed. Check JIRA_API_TOKEN and JIRA_USER_EMAIL in your .env file.';
    if (status === 403) return 'Access denied by Jira. Ensure the service account has read access to project NL.';
    if (status === 429) return 'Jira rate limit exceeded. Please wait a moment and try again.';
    if (status >= 500) return 'Jira is currently unreachable. Please check the JIRA_BASE_URL or try again later.';
    return 'An error occurred while fetching data from Jira.';
  }
  if (err.isOAuthError) return err.message;
  if (status === 401) return 'Not authenticated. Please log in.';
  if (status === 400) return err.message || 'Bad request.';
  return 'An unexpected error occurred. Please try again.';
}

module.exports = { errorHandler };
