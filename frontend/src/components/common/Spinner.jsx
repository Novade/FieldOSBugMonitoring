export function Spinner({ height, label }) {
  return (
    <div
      className={`flex items-center justify-center ${label ? 'min-h-[400px]' : ''}`}
      style={height ? { height } : undefined}
    >
      <div className="text-center">
        <div className={`inline-block border-4 border-brand border-t-transparent rounded-full animate-spin ${label ? 'w-8 h-8 mb-4' : 'w-6 h-6'}`} />
        {label && <p className="text-[14px] text-[#6b7a99]">{label}</p>}
      </div>
    </div>
  );
}
