import { useRef, useState } from 'react';

export function ChartLegend({ datasets, chartRef }) {
  const [muted, setMuted] = useState({});

  function toggle(i) {
    if (!chartRef?.current) return;
    const chart = chartRef.current;
    const meta = chart.getDatasetMeta(i);
    meta.hidden = !meta.hidden;
    chart.update();
    setMuted((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <div className="flex flex-wrap gap-3.5 mt-2.5 pb-0.5">
      {datasets.map((ds, i) => {
        const color =
          (Array.isArray(ds.borderColor)
            ? ds.borderColor[0]
            : ds.borderColor) ||
          (Array.isArray(ds.backgroundColor)
            ? ds.backgroundColor[0]
            : ds.backgroundColor) ||
          '#999';
        return (
          <span
            key={ds.label}
            onClick={() => toggle(i)}
            className={`flex items-center gap-1.5 text-[11px] text-[#6b7a99] cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#f5f7fa] transition-opacity ${
              muted[i] ? 'opacity-30' : ''
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ background: color }}
            />
            {ds.label}
          </span>
        );
      })}
    </div>
  );
}
