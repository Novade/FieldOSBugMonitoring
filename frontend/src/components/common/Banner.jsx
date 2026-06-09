export function Banner({ message, visible }) {
  if (!visible || !message) return null;
  return (
    <div className="flex items-center gap-2 bg-[#fffbeb] border border-[#fcd34d] rounded-md px-[14px] py-[10px] text-[12px] text-[#92400e] mb-4">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{message}</span>
    </div>
  );
}
