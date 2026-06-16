function toDateStr(isoString) {
  if (!isoString) return null;
  return isoString.slice(0, 10);
}

function extractMultiSelect(field) {
  if (!Array.isArray(field)) return [];
  return field.map((v) => (typeof v === 'object' ? v.value : v)).filter(Boolean);
}

const OS_CANONICAL = { ios: 'iOS', android: 'Android', web: 'Web' };
const REGION_CANONICAL = { apac: 'APAC', emea: 'EMEA', australia: 'Australia' };

function normalizeValues(values, canonicalMap) {
  return values.map((v) => canonicalMap[v.toLowerCase()] ?? v);
}

function extractWorkspaceNames(raw) {
  if (!raw) return [];
  const cleaned = raw
    .replace(/\s*\([a-zA-Z0-9]{15,}\)$/, '')
    .replace(/\s*-\s*[a-zA-Z0-9]{15,}$/, '')
    .replace(/\s+[a-zA-Z0-9]{15,}$/, '')
    .trim();
  if (!cleaned) return [];
  return cleaned.split(/\s*&\s*/).map((s) => s.trim()).filter(Boolean);
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
    w: extractWorkspaceNames(f.customfield_10568),
    reg: normalizeValues(extractMultiSelect(f.customfield_10577), REGION_CANONICAL),
    os: normalizeValues(extractMultiSelect(f.customfield_10571), OS_CANONICAL),
  };
}

module.exports = { transformIssue, extractWorkspaceNames, extractMultiSelect };
