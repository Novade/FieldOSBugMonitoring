export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - 3 + i);
export const YOY_COLORS = ['#3b6cb7', '#16a34a', '#d97706', '#64748b'];

export function badgeClass(sl) {
  if (sl == null) return 'bg-canvas-alt text-ink-muted';
  if (sl >= 99) return 'bg-success-tint text-success-ink';
  if (sl >= 97) return 'bg-warning-tint text-warning-ink';
  return 'bg-danger-tint text-danger-ink';
}

export function fmtDowntime(seconds) {
  if (!seconds) return '0m';
  const totalMins = Math.floor(seconds / 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function fmtDate(dateStr) {
  const parts = dateStr.split('-');
  return `${MONTH_LABELS[parseInt(parts[1], 10) - 1]} ${parseInt(parts[2], 10)}`;
}
