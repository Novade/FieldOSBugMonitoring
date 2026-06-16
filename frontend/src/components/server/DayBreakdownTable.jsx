import { Card } from '../common/Card';
import { Spinner } from '../common/Spinner';
import { badgeClass, fmtDowntime, fmtDate } from '../../utils/serverUtils';

export function DayBreakdownTable({ days, loading, error, selectedMonth, selectedMonthName, selectedYear, selectedTabName }) {
  return (
    <Card
      accent="blue"
      title="Day Breakdown"
      subtitle={selectedMonthName ? `${selectedMonthName} ${selectedYear} — ${selectedTabName}` : ''}
    >
      {!selectedMonth ? (
        <div className="flex items-center justify-center" style={{ height: 200 }}>
          <p className="text-[13px] text-[#b0bac8]">Select a month to see daily detail</p>
        </div>
      ) : loading ? (
        <Spinner />
      ) : error ? (
        <p className="text-red-500 text-[13px]">{error}</p>
      ) : (
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr className="text-[11px] text-[#8896b0] uppercase">
              <th className="text-left pb-2 font-medium">Date</th>
              <th className="text-right pb-2 font-medium">Service Level</th>
              <th className="text-right pb-2 font-medium">Downtime</th>
              <th className="text-right pb-2 font-medium">Outages</th>
            </tr>
          </thead>
          <tbody>
            {days.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-[#8896b0] py-6 text-[13px]">No daily data available</td>
              </tr>
            ) : (
              days.map((d) => (
                <tr key={d.date} className="border-t border-[#f0f2f5]">
                  <td className="py-2 text-[#6b7a99] font-mono text-[12px]">{fmtDate(d.date)}</td>
                  <td className="text-right py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${badgeClass(d.serviceLevel)}`}>
                      {d.serviceLevel?.toFixed(3)}%
                    </span>
                  </td>
                  <td className="text-right py-2 font-mono text-[12px] text-[#6b7a99]">{fmtDowntime(d.downtime)}</td>
                  <td className="text-right py-2 font-mono text-[12px] text-[#6b7a99]">{d.outages}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </Card>
  );
}
