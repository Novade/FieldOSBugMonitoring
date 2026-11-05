export function KpiTile({ label, value, accent }) {
  return (
    <div className="flex-1 min-w-0 bg-surface rounded-lg border border-line px-4 py-4">
      <div className="text-[11px] text-ink-subtle uppercase tracking-wide mb-2">{label}</div>
      <div className="text-[22px] font-bold leading-none truncate" style={{ color: accent }}>{value}</div>
    </div>
  );
}
