import { Chart } from 'chart.js';

// Vertical crosshair for line charts
const crosshairPlugin = {
  id: 'xhair',
  afterDraw(c) {
    if (c.config.type !== 'line' || c._hi == null) return;
    const m = c.getDatasetMeta(0);
    if (!m?.data?.[c._hi]) return;
    const x = m.data[c._hi].x;
    const ctx = c.ctx;
    const y = c.scales.y;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y.top);
    ctx.lineTo(x, y.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(100,116,139,.5)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.restore();
  },
  afterEvent(c, a) {
    if (c.config.type !== 'line') return;
    const e = a.event;
    const xs = c.scales.x;
    if (e.type === 'mousemove' && xs && e.x >= xs.left && e.x <= xs.right) {
      const m = c.getDatasetMeta(0);
      if (!m?.data?.length) return;
      let ni = 0, md = Infinity;
      m.data.forEach((p, i) => {
        const d = Math.abs(p.x - e.x);
        if (d < md) { md = d; ni = i; }
      });
      if (c._hi !== ni) { c._hi = ni; c.draw(); }
    } else if (e.type === 'mouseout' && c._hi != null) {
      c._hi = null;
      c.draw();
    }
  },
};

// Dashed target lines on the deployment time bar chart
const deployTargetsPlugin = {
  id: 'deployTargets',
  afterDraw(chart) {
    if (chart.canvas.id !== 'cDeploy') return;
    const { ctx, scales: { y }, options: { deployTargets } } = chart;
    if (!deployTargets) return;
    const meta = chart.getDatasetMeta(0);
    deployTargets.forEach((target, i) => {
      if (!meta.data[i]) return;
      const bar = meta.data[i];
      const ty = y.getPixelForValue(target);
      const hw = bar.width / 2;
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 1.5;
      ctx.moveTo(bar.x - hw, ty);
      ctx.lineTo(bar.x + hw, ty);
      ctx.stroke();
      ctx.restore();
    });
  },
};

// Factory: renders value labels inside each doughnut arc
export function makeDonutValueLabelsPlugin(id) {
  return {
    id,
    afterDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, i) => {
        chart.getDatasetMeta(i).data.forEach((arc, index) => {
          const value = dataset.data[index];
          if (!value) return;
          const angle = arc.endAngle - arc.startAngle;
          if (angle < 0.3) return;
          const midAngle = arc.startAngle + angle / 2;
          const r = (arc.outerRadius + arc.innerRadius) / 2;
          const x = arc.x + r * Math.cos(midAngle);
          const y = arc.y + r * Math.sin(midAngle);
          ctx.save();
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = '#fff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(value, x, y);
          ctx.restore();
        });
      });
    },
  };
}

// Factory: renders value labels to the right of each horizontal bar
export function makeBarValueLabelsPlugin(id) {
  return {
    id,
    afterDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((dataset, i) => {
        chart.getDatasetMeta(i).data.forEach((bar, index) => {
          const value = dataset.data[index];
          if (!value) return;
          ctx.save();
          ctx.font = '600 10px sans-serif';
          ctx.fillStyle = '#4a5568';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(value, bar.x + 4, bar.y);
          ctx.restore();
        });
      });
    },
  };
}

let registered = false;
export function registerChartPlugins() {
  if (registered) return;
  Chart.register(crosshairPlugin, deployTargetsPlugin);
  registered = true;
}
