import { useState, useEffect, useRef } from 'react';
import { fetchWorkspaces } from '../services/jiraService';

export function ClientBugsPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchWorkspaces()
      .then((data) => setWorkspaces(data.workspaces))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filtered = workspaces.filter((w) =>
    w.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(name) {
    setSelected(name);
    setSearch(name);
    setOpen(false);
  }

  function handleClear() {
    setSelected('');
    setSearch('');
    setOpen(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[14px] text-[#6b7a99]">Loading workspaces…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      {error && (
        <p className="text-red-500 text-[13px] mb-4">{error}</p>
      )}
      <p className="text-[13px] font-medium text-[#6b7a99] mb-2">Select Workspace</p>
      <div ref={containerRef} className="relative w-80">
        <input
          type="text"
          placeholder="Search workspace..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelected('');
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full px-4 py-2 pr-8 text-[14px] rounded-lg border border-[#d1d9e6] shadow-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-[#1a1a2e] bg-white"
        />
        {search && (
          <button
            onMouseDown={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7a99] hover:text-[#1a1a2e] text-[16px] leading-none"
            tabIndex={-1}
          >
            ×
          </button>
        )}
        {open && filtered.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-white border border-[#d1d9e6] rounded-lg shadow-md">
            {filtered.map((name) => (
              <li
                key={name}
                onMouseDown={() => handleSelect(name)}
                className={`px-4 py-2 text-[14px] cursor-pointer hover:bg-[#f0f4ff] ${
                  selected === name ? 'text-brand font-medium' : 'text-[#1a1a2e]'
                }`}
              >
                {name}
              </li>
            ))}
          </ul>
        )}
        {open && filtered.length === 0 && search && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d9e6] rounded-lg shadow-md px-4 py-3 text-[13px] text-[#6b7a99]">
            No workspaces found
          </div>
        )}
      </div>
    </div>
  );
}
