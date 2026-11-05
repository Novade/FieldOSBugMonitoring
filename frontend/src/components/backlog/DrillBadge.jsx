export function DrillBadge({ drill, onClear }) {
  if (!drill) return null;
  return (
    <div className="inline-flex items-center gap-1.5 bg-brand-tint text-brand-dark px-3 py-1 rounded-[20px] text-[12px] font-medium mb-3 border border-[#c5d3f0]">
      <span>Filtered: <strong>{drill.label}</strong></span>
      <button onClick={onClear} className="bg-none border-none cursor-pointer text-brand-dark text-sm leading-none ml-0.5">×</button>
    </div>
  );
}
