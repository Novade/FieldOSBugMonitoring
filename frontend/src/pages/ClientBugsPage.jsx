import { useState, useEffect, useRef } from 'react';
import { useClientBugsData } from '../hooks/useClientBugsData';
import { Card } from '../components/common/Card';
import { KpiRow } from '../components/kpi/KpiRow';
import { BacklogTable } from '../components/backlog/BacklogTable';
import { TopWorkspacesByTotalChart } from '../components/charts/TopWorkspacesByTotalChart';
import { WorkspaceBugDistributionChart } from '../components/charts/WorkspaceBugDistributionChart';
import { TopWorkspacesByOpenChart } from '../components/charts/TopWorkspacesByOpenChart';
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
    setTimeout(() => backlogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
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

  function handleSelectFromChart(name) {
    setSelected(name);
    setSearch(name);
    setOpen(false);
    setDrill({ key: 'all', val: '', label: name });
    setTimeout(
      () =>
        backlogRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      50
    );
  }

  function handleSelectFromOpenChart(name) {
    setSelected(name);
    setSearch(name);
    setOpen(false);
    setDrill({ key: 'open', val: true, label: 'Open bugs' });
    setTimeout(
      () =>
        backlogRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      50
    );
  }

  const workspaceIssues = selected ? bugs.filter((b) => b.w === selected) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[14px] text-[#6b7a99]">Loading client bugs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}

      {/* Global charts — always visible */}
      <div className="grid grid-cols-3 max-[1100px]:grid-cols-1 gap-4 mb-8">
        <Card
          accent="blue"
          title="Top Workspaces by Total Bugs"
          subtitle="All bugs created since Jan 2026"
        >
          <div style={{ height: 280 }}>
            <TopWorkspacesByTotalChart
              issues={bugs}
              onSelectWorkspace={handleSelectFromChart}
            />
          </div>
        </Card>
        <Card
          accent="purple"
          title="Bug Distribution by Workspace"
          subtitle="Share of total bugs across all workspaces"
        >
          <div style={{ height: 280 }}>
            <WorkspaceBugDistributionChart
              issues={bugs}
              onSelectWorkspace={handleSelectFromChart}
            />
          </div>
        </Card>
        <Card
          accent="amber"
          title="Top Workspaces by Open Bugs"
          subtitle="Click a bar to jump to that workspace"
        >
          <div style={{ height: 280 }}>
            <TopWorkspacesByOpenChart
              issues={bugs}
              onSelectWorkspace={handleSelectFromOpenChart}
            />
          </div>
        </Card>
      </div>

      {/* Workspace selector */}
      <div className="flex flex-col items-center mb-8">
        <p className="text-[13px] font-medium text-[#6b7a99] mb-2">
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
            className="w-full px-4 py-2 pr-8 text-[14px] rounded-lg border border-[#d1d9e6] shadow-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-[#1a1a2e] bg-white"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear workspace selection"
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
                  className={`px-4 py-2 text-[14px] cursor-pointer hover:bg-[#f0f4ff] ${
                    selected === name
                      ? 'text-brand font-medium'
                      : 'text-[#1a1a2e]'
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

      {/* Workspace-specific dashboard */}
      <div ref={workspaceSectionRef}>
        <p className="text-[15px] font-semibold text-[#1a2332] mb-4">
          {selected || (
            <span className="text-[#6b7a99] font-normal">
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

      {/* Inline backlog — appears when any chart or KPI is clicked */}
      {drill && (
        <div ref={backlogRef} className="mt-4">
          <BacklogTable
            issues={workspaceIssues}
            drill={drill}
            onClearDrill={() => setDrill(null)}
            showWorkspace
          />
        </div>
      )}
    </div>
  );
}
