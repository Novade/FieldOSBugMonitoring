// Bug escape rate = bugs after prod / (bugs during testing + bugs after prod).
// Entries are stored as a JSON file on a dedicated GitHub data branch (never
// main, so saving an entry doesn't trigger the Azure deploy pipeline).

const PROJECT_KEY = 'NL';
const QA_LABEL = 'QA-BUG';
const EXCLUDED_LABELS = ['no-action-done', 'cannot-reproduce'];

function quoteList(labels) {
  return labels.map((l) => `"${l}"`).join(', ');
}

// Jira treats `created < "YYYY-MM-DD"` as before midnight of that day, so the
// day after `to` is used to make the end date inclusive.
function nextDay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function buildJql({ scope, from, to }) {
  const base = `project = ${PROJECT_KEY} AND issuetype = Bug AND created >= "${from}" AND created < "${nextDay(to)}"`;
  if (scope === 'prod') {
    // `labels NOT IN (...)` alone drops unlabelled issues, hence `labels IS EMPTY`
    return `${base} AND (labels IS EMPTY OR labels NOT IN (${quoteList([QA_LABEL, ...EXCLUDED_LABELS])})) ORDER BY created DESC`;
  }
  if (scope === 'test') {
    return `${base} AND labels = "${QA_LABEL}" AND labels NOT IN (${quoteList(EXCLUDED_LABELS)}) ORDER BY created DESC`;
  }
  throw new Error(`Unknown escape rate scope: ${scope}`);
}

module.exports = {
  buildJql,
  storage: {
    repo: 'FieldOSBugMonitoring',
    path: 'escapeRates.json',
    branch: process.env.ESCAPE_RATE_DATA_BRANCH || 'escape-rate-data',
  },
};
