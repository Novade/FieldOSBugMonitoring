const ACCENT_COLORS = {
  blue: 'border-t-[#3b6cb7]',
  teal: 'border-t-[#2196a4]',
  purple: 'border-t-[#5c4fa3]',
  indigo: 'border-t-[#3d52a0]',
  slate: 'border-t-[#4a6280]',
  coral: 'border-t-[#c0392b]',
  amber: 'border-t-[#e67e22]',
};

export function Card({
  accent = 'blue',
  title,
  subtitle,
  children,
  className = '',
}) {
  const accentClass = ACCENT_COLORS[accent] || ACCENT_COLORS.blue;
  return (
    <div
      className={`bg-white rounded-lg border border-[#dde2ea] overflow-hidden ${className}`}
    >
      <div className={`px-[18px] pt-[14px] border-t-[3px] ${accentClass}`}>
        <div className="text-[16px] font-semibold text-[#1a2332] mb-0.5">
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] text-[#8896b0] mb-3 mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      <div className="px-[18px] pb-4">{children}</div>
    </div>
  );
}
