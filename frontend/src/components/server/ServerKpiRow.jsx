import { fmtDowntime } from '../../utils/serverUtils';
import { KpiTile } from '../common/KpiTile';

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
