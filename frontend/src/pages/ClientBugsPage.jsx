import { useState, useEffect, useRef } from 'react';
import { useClientBugsData } from '../hooks/useClientBugsData';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { KpiRow } from '../components/kpi/KpiRow';
import { BacklogTable } from '../components/backlog/BacklogTable';
import { WeeklyCreatedVsResolvedChart } from '../components/charts/WeeklyCreatedVsResolvedChart';
import { PriorityChart } from '../components/charts/PriorityChart';

export function ClientBugsPage() {
  const { bugs, workspaces, loading, error } = useClientBugsData();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [open, setOpen] = useState(false);
  const [drill, setDrill] = useState(null);
  const containerRef = useRef(null);
  const workspaceSectionRef = useRef(null);
  const backlogRef = useRef(null);

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
    setDrill({ key: 'all', val: '', label: name });
    setTimeout(() => workspaceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function handleClear() {
    setSelected('');
    setSearch('');
    setOpen(false);
    setDrill(null);
  }

  function handleDrillTo(key, val, label) {
    setDrill({ key, val, label });
    setTimeout(
      () =>
        backlogRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      50
    );
  }


  const workspaceIssues = selected ? bugs.filter((b) => b.w.includes(selected)) : [];

  if (loading) return <Spinner label="Loading client bugs…" />;

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}

      {/* Workspace selector */}
      <div className="flex flex-col items-center mb-8">
        <p className="text-[13px] font-medium text-ink-muted mb-2">
          Select Workspace
        </p>
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
            className="w-full px-4 py-2 pr-8 text-[14px] rounded-lg border border-line shadow-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-ink bg-surface"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear workspace selection"
              onMouseDown={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-[16px] leading-none"
              tabIndex={-1}
            >
              ×
            </button>
          )}
          {open && filtered.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto bg-surface border border-line rounded-lg shadow-md">
              {filtered.map((name) => (
                <li
                  key={name}
                  role="option"
                  aria-selected={selected === name}
                  tabIndex={0}
                  onMouseDown={() => handleSelect(name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(name);
                    }
                  }}
                  className={`px-4 py-2 text-[14px] cursor-pointer hover:bg-brand-tint ${
                    selected === name
                      ? 'text-brand font-medium'
                      : 'text-ink'
                  }`}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          {open && filtered.length === 0 && search && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-line rounded-lg shadow-md px-4 py-3 text-[13px] text-ink-muted">
              No workspaces found
            </div>
          )}
        </div>
      </div>

      {/* Workspace-specific dashboard */}
      <div ref={workspaceSectionRef}>
        <p className="text-[15px] font-semibold text-ink mb-4">
          {selected || (
            <span className="text-ink-muted font-normal">
              No workspace selected
            </span>
          )}
        </p>
        <KpiRow issues={workspaceIssues} onDrillTo={handleDrillTo} />
        <div className="grid grid-cols-2 max-[1100px]:grid-cols-1 gap-4 mb-4 mt-4">
          <Card
            accent="slate"
            title="Weekly created vs resolved"
            subtitle="Bugs created vs resolved per week"
          >
            <WeeklyCreatedVsResolvedChart
              issues={workspaceIssues}
              onDrillTo={handleDrillTo}
            />
          </Card>
          <Card
            accent="blue"
            title="Bugs by priority"
            subtitle="Created vs resolved by severity"
          >
            <PriorityChart issues={workspaceIssues} onDrillTo={handleDrillTo} />
          </Card>
        </div>
      </div>

      {/* Backlog — always visible */}
      <div ref={backlogRef} className="mt-4">
        <BacklogTable
          issues={workspaceIssues}
          drill={drill}
          onClearDrill={() => setDrill(null)}
          showWorkspace
        />
      </div>
    </div>
  );
}
