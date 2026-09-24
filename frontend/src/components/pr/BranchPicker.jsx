import { useEffect, useMemo, useRef, useState } from 'react';
import { GitBranch, ChevronDown, Search } from 'lucide-react';

export function BranchPicker({ branches, selected, onSelect, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <div className="relative inline-block" ref={containerRef}>
      <button
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
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-[280px] bg-white border border-[#dde2ea] rounded-lg shadow-lg overflow-hidden">
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
        </div>
      )}
    </div>
  );
}
