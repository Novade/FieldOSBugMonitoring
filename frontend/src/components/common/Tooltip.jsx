import { useRef, useState } from 'react';

export function Tooltip({ label, note, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0, visible: false });
  const wrapRef = useRef(null);

  function handleMouseEnter() {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: Math.min(rect.left, window.innerWidth - 244),
      visible: true,
    });
  }

  return (
    <span className="relative inline-flex items-center" ref={wrapRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setPos((p) => ({ ...p, visible: false }))}>
      {children}
      <span className="w-[14px] h-[14px] rounded-full bg-[#dde8f7] inline-flex items-center justify-center text-[9px] font-bold text-brand cursor-default shrink-0 ml-1">
        i
      </span>
      {pos.visible && (
        <div
          className="fixed z-[9999] bg-[#1a2332] text-[#e8edf5] text-[11px] leading-relaxed px-3 py-2.5 rounded-md w-[230px] pointer-events-none"
          style={{ top: pos.top, left: pos.left }}
        >
          {label && <div className="text-[10px] font-semibold text-[#94a8c8] uppercase tracking-wide mb-1.5">{label}</div>}
          {note ? (
            <>
              <div>{children}</div>
              <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-[#94a8c8]">{note}</div>
            </>
          ) : (
            <div>Bugs with status: To Do, In Progress, Code Review, Blocked, or Failed.<div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-[#94a8c8]">Excludes issues already fixed or awaiting deployment.</div></div>
          )}
        </div>
      )}
    </span>
  );
}
