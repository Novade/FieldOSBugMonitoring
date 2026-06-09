// Returns the ISO date string of the Monday of the week containing the given date string
export function ws(d) {
  const dt = new Date(d + 'T00:00:00');
  const day = dt.getDay();
  const diff = dt.getDate() - (day === 0 ? 6 : day - 1);
  dt.setDate(diff);
  // Use local date parts — toISOString() converts to UTC and shifts the date in UTC+ timezones
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Returns "M/DD" label for a week-start ISO string
export function wl(w) {
  const d = new Date(w + 'T00:00:00');
  return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`;
}

// Returns the median of a numeric array, or null if empty
export function med(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Counts working days (Mon–Fri) between two YYYY-MM-DD strings, exclusive of start
export function workingDays(startStr, endStr) {
  let start = new Date(startStr + 'T00:00:00');
  let end = new Date(endStr + 'T00:00:00');
  if (end < start) {
    const tmp = start;
    start = end;
    end = tmp;
  }
  let days = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getDay() !== 0 && cur.getDay() !== 6) days++;
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(0, days - 1);
}

export function formatSyncTime(isoString) {
  const d = new Date(isoString);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const offsetMin = -d.getTimezoneOffset();
  const offsetH = Math.floor(Math.abs(offsetMin) / 60);
  const offsetM = Math.abs(offsetMin) % 60;
  const tz = `GMT${offsetMin >= 0 ? '+' : '-'}${offsetH}${
    offsetM ? ':' + String(offsetM).padStart(2, '0') : ''
  }`;
  return `Last sync - ${month} ${day}, ${year} · ${h12}:${m} ${ampm} ${tz}`;
}
