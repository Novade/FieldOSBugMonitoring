function toDateStr(isoString) {
  if (!isoString) return null;
  return isoString.slice(0, 10);
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
  };
}

module.exports = { transformIssue };
