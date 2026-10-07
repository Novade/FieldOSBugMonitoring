import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, title, onClose, busy = false, footer, children, width = 'max-w-[480px]' }) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKey(e) {
      if (e.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${width} bg-white rounded-lg border border-[#dde2ea] shadow-lg`}
      >
        <div className="flex items-center justify-between px-[18px] py-[14px] border-b border-[#eef0f4]">
          <div className="text-[16px] font-semibold text-[#1a2332]">{title}</div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-1 rounded-md text-[#8896b0] hover:bg-[#f0f2f5] hover:text-[#1a2332] disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-[18px] py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-[18px] py-3 border-t border-[#eef0f4] bg-[#f5f7fa] rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
