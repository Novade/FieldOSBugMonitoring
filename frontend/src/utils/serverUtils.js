export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - 3 + i);
export const YOY_COLORS = ['#3b6cb7', '#16a34a', '#d97706', '#64748b'];

export function badgeClass(sl) {
  if (sl == null) return 'bg-gray-100 text-gray-500';
  if (sl >= 99) return 'bg-green-100 text-green-700';
  if (sl >= 97) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700';
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
