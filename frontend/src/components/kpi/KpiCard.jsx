import { Tooltip } from '../common/Tooltip';

const ACCENT = {
  created: 'before:bg-[#3b6cb7]',
  resolved: 'before:bg-[#2e7d5e]',
  open: 'before:bg-[#d97706]',
  blocked: 'before:bg-[#c0392b]',
  deploy: 'before:bg-[#6d28d9]',
};

export function KpiCard({
  type = 'created',
  label,
  value,
  sub,
  warn,
  onClick,
  showTooltip,
  group = 'primary',
}) {
  const accent = ACCENT[type] || ACCENT.created;
  const valueColor = warn
    ? 'text-[#c0392b]'
    : warn === false
    ? 'text-[#2e7d5e]'
    : 'text-[#1a2332]';
  const sizeClass =
    group === 'primary'
      ? 'flex-[1_1_0] min-w-[180px] max-w-[300px]'
      : 'flex-[1_1_0] min-w-[160px] max-w-[260px]';

  return (
    <div
      onClick={onClick}
      title={onClick ? `View ${label.toLowerCase()}` : undefined}
      className={`relative bg-white rounded-lg border border-[#dde2ea] px-4 py-[14px] cursor-pointer transition-all duration-150
        hover:border-brand hover:shadow-[0_2px_12px_rgba(59,108,183,.12)]
        before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-lg ${accent}
        ${sizeClass}`}
    >
      <div className="text-[12px] font-semibold uppercase tracking-[.5px] mb-3 flex items-center gap-1">
        {label}
        {showTooltip && <Tooltip label="Counted as open" />}
      </div>
      <div className={`text-[25px] font-bold ${valueColor}`}>
        {value ?? '-'}
      </div>
      {sub && <div className="text-[11px] text-[#8896b0] mt-3">{sub}</div>}
    </div>
  );
}
