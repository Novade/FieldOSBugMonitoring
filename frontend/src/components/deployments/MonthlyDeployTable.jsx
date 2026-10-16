import { HoverLabel } from '../common/HoverLabel';
import { td, th } from '../common/tableStyles';
import { formatMonth } from '../../utils/dateUtils';

// Marks a count that may be low: the group has no environment history and this
// month started before tracking, so runs Azure DevOps already deleted are missing.
function PartialTag() {
  return (
    <HoverLabel
      label="May be incomplete: tracking started after this month, and Azure DevOps had already deleted older runs"
      className="inline-flex"
    >
      <span className="mr-2 px-1.5 py-[1px] rounded text-[10px] font-semibold bg-[#fef3e2] text-[#d97706]">
        Partial
      </span>
    </HoverLabel>
  );
}

export function MonthlyDeployTable({ groups, months, completeFrom }) {
  if (!months.length) {
    return <div className="text-center text-[#8896b0] py-6 text-[13px]">No data available</div>;
  }

  const thRight = `${th} text-right`;
  const tdNum = `${td} text-right tabular-nums`;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr>
            <th className={th}>Month</th>
            {groups.map((g) => (
              <th key={g} className={thRight}>{g}</th>
            ))}
            <th className={thRight}>Prod total</th>
            <th className={thRight}>Staging total</th>
          </tr>
        </thead>
        <tbody>
          {[...months].reverse().map((m) => (
            <tr key={m.month} className="hover:bg-[#f7f8fa]">
              <td className={`${td} text-[#6b7a99]`}>{formatMonth(m.month)}</td>
              {groups.map((g) => (
                <td key={g} className={tdNum}>
                  {completeFrom[g] && m.month < completeFrom[g] && <PartialTag />}
                  {m.prod[g] || 0}
                </td>
              ))}
              <td className={`${tdNum} font-semibold text-[#1a2332]`}>{m.prodTotal}</td>
              <td className={`${tdNum} text-[#6b7a99]`}>{m.stagingTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
