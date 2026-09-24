import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { GitBranch, ChevronDown, Search } from 'lucide-react';

const POPOVER_WIDTH = 280;
// Rough max height (search box + list) used only to decide whether to flip
// the popover upward — doesn't need to be exact.
const POPOVER_EST_HEIGHT = 340;

export function BranchPicker({ branches, selected, onSelect, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  // Popover renders in a portal (see below) so it isn't clipped by an
  // ancestor's `overflow: hidden` (e.g. Card.jsx) — a plain absolutely
  // positioned child would get cut off whenever this control sits near the
  // bottom of its containing Card.
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < POPOVER_EST_HEIGHT && spaceAbove > spaceBelow;
    setPos({
      left: rect.left,
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    // Closing on scroll/resize is simpler and more robust than tracking the
    // button's position live while a fixed-position popover is open. Scroll
    // uses the capture phase so it catches scrolling anywhere on the page
    // (scroll events don't bubble) — but that also means it sees scrolling
    // inside the popover's own branch list, which must NOT close it.
    function handleScroll(e) {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      setOpen(false);
    }
    function handleResize() {
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query) return branches || [];
    const q = query.toLowerCase();
    return (branches || []).filter((b) => b.toLowerCase().includes(q));
  }, [branches, query]);

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'Enter' && filtered.length) {
      onSelect(filtered[0]);
      setOpen(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        title={disabled ? 'Please select a repo first' : undefined}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-[13px] border border-[#dde2ea] rounded-lg px-3 py-2 bg-white text-[#1a2332] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#f5f7fa]'
        }`}
      >
        <GitBranch size={14} className="text-[#6b7a99]" />
        {selected || 'Select branch'}
        <ChevronDown size={14} className="text-[#8896b0]" />
      </button>
      {open &&
        !disabled &&
        pos &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom, width: POPOVER_WIDTH }}
            className="z-50 bg-white border border-[#dde2ea] rounded-lg shadow-lg overflow-hidden"
          >
            <div className="p-2 border-b border-[#dde2ea]">
              <div className="flex items-center gap-1.5 px-2 py-1.5 border border-[#dde2ea] rounded-md bg-[#f5f7fa]">
                <Search size={13} className="text-[#8896b0]" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Find a branch…"
                  className="flex-1 bg-transparent outline-none text-[13px] text-[#1a2332]"
                />
              </div>
            </div>
            <div className="max-h-[260px] overflow-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-4 text-[13px] text-[#8896b0] text-center">No branches found</div>
              ) : (
                filtered.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      onSelect(b);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-[13px] hover:bg-[#f5f7fa] ${
                      b === selected ? 'bg-[#eef3fc] text-[#3b6cb7] font-medium' : 'text-[#1a2332]'
                    }`}
                  >
                    {b}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
