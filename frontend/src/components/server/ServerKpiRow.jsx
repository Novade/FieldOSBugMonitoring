import { fmtDowntime } from '../../utils/serverUtils';

function KpiTile({ label, value, accent }) {
  return (
    <div className="flex-1 min-w-0 bg-white rounded-lg border border-[#dde2ea] px-4 py-4">
      <div className="text-[11px] text-[#8896b0] uppercase tracking-wide mb-2">{label}</div>
      <div className="text-[22px] font-bold leading-none truncate" style={{ color: accent }}>{value}</div>
    </div>
  );
}

export function ServerKpiRow({ kpis }) {
  return (
    <div className="flex gap-3 mb-5 overflow-hidden">
      <KpiTile label="Avg Service Level" value={kpis.avgSL != null ? `${kpis.avgSL}%` : '—'} accent="#3b6cb7" />
      <KpiTile label="Total Downtime" value={fmtDowntime(kpis.totalDowntime)} accent="#e67e22" />
      <KpiTile label="Total Outages" value={String(kpis.totalOutages)} accent="#c0392b" />
      <KpiTile label="Avg Monthly Downtime" value={fmtDowntime(kpis.avgDowntime)} accent="#5c4fa3" />
    </div>
  );
}
