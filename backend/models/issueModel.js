function toDateStr(isoString) {
  if (!isoString) return null;
  return isoString.slice(0, 10);
}

function toTitleCase(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractWorkspaceName(raw) {
  if (!raw) return null;
  const cleaned = raw
    .replace(/\s*\([a-zA-Z0-9]{15,}\)$/, '')
    .replace(/\s*-\s*[a-zA-Z0-9]{15,}$/, '')
    .trim();
  return toTitleCase(cleaned);
}

function transformIssue(raw) {
  const f = raw.fields;
  return {
    k: raw.key,
    s: f.summary || '',
    a: f.assignee ? f.assignee.displayName : 'Unassigned',
    st: f.status ? f.status.name : 'Unknown',
    p: f.priority ? f.priority.name : 'Medium',
    c: toDateStr(f.created),
    r: toDateStr(f.resolutiondate),
    d: toDateStr(f.customfield_10733),
    w: extractWorkspaceName(f.customfield_10568),
  };
}

module.exports = { transformIssue, extractWorkspaceName, toTitleCase };
