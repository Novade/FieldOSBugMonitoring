import { useRef, useState } from 'react';
import { useClientBugsData } from '../hooks/useClientBugsData';
import { Card } from '../components/common/Card';
import { Spinner } from '../components/common/Spinner';
import { BacklogTable } from '../components/backlog/BacklogTable';
import { TopWorkspacesByTotalChart } from '../components/charts/TopWorkspacesByTotalChart';
import { WorkspaceBugDistributionChart } from '../components/charts/WorkspaceBugDistributionChart';
import { TopWorkspacesByOpenChart } from '../components/charts/TopWorkspacesByOpenChart';
import { RegionDistributionChart } from '../components/charts/RegionDistributionChart';
import { OSDistributionChart } from '../components/charts/OSDistributionChart';

export function WorkspaceGlobalPage() {
  const { bugs, loading, error } = useClientBugsData();
  const [drill, setDrill] = useState(null);
  const backlogRef = useRef(null);

  function setDrillAndScroll(d) {
    setDrill(d);
    setTimeout(() => backlogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  if (loading) return <Spinner label="Loading data…" />;

  return (
    <div className="max-w-[1380px] mx-auto px-7 py-6">
      {error && <p className="text-red-500 text-[13px] mb-4">{error}</p>}

      {/* Row 1: workspace charts */}
      <div className="grid grid-cols-3 max-[1100px]:grid-cols-1 gap-4 mb-4">
        <Card
          accent="blue"
          title="Top Workspaces by Total Bugs"
          subtitle="All bugs created since Jan 2026"
        >
          <div style={{ height: 280 }}>
            <TopWorkspacesByTotalChart
              issues={bugs}
              onSelectWorkspace={(name) => setDrillAndScroll({ key: 'workspace', val: name, label: name })}
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
              onSelectWorkspace={(name) => setDrillAndScroll({ key: 'workspace', val: name, label: name })}
            />
          </div>
        </Card>
        <Card
          accent="amber"
          title="Top Workspaces by Open Bugs"
          subtitle="Click a bar to drill into open bugs"
        >
          <div style={{ height: 280 }}>
            <TopWorkspacesByOpenChart
              issues={bugs}
              onSelectWorkspace={(name) => setDrillAndScroll({ key: 'workspace_open', val: name, label: `${name} — Open bugs` })}
            />
          </div>
        </Card>
      </div>

      {/* Row 2: region + OS charts */}
      <div className="grid grid-cols-2 max-[800px]:grid-cols-1 gap-4 mb-8 max-w-[920px] mx-auto">
        <Card
          accent="green"
          title="Bug Distribution by Region"
          subtitle="Click a segment to drill into that region"
        >
          <div style={{ height: 280 }}>
            <RegionDistributionChart
              issues={bugs}
              onDrillTo={(key, val) => setDrillAndScroll({ key, val, label: `Region: ${val}` })}
            />
          </div>
        </Card>
        <Card
          accent="red"
          title="Bug Distribution by OS / Device"
          subtitle="Click a segment to drill into that OS"
        >
          <div style={{ height: 280 }}>
            <OSDistributionChart
              issues={bugs}
              onDrillTo={(key, val) => setDrillAndScroll({ key, val, label: `OS: ${val}` })}
            />
          </div>
        </Card>
      </div>

      {/* Backlog — always visible */}
      <div ref={backlogRef} className="mt-4">
        <BacklogTable
          issues={bugs}
          drill={drill}
          onClearDrill={() => setDrill(null)}
          showWorkspace
        />
      </div>
    </div>
  );
}
