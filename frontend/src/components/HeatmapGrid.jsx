import { scoreColor } from '../utils/colors';

export default function HeatmapGrid({ agreement }) {
  if (!agreement?.pairwise) return null;
  const entries = Object.entries(agreement.pairwise);
  if (entries.length === 0) return null;

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-[10px] font-space text-[#475569] uppercase tracking-widest">
        Agreement Matrix
      </h3>
      <div className="space-y-2.5">
        {entries.map(([pair, sim]) => {
          const color = scoreColor(sim);
          return (
            <div key={pair} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-[#94A3B8] font-mono">{pair}</span>
                <span className="text-[11px] font-mono font-bold" style={{ color }}>
                  {(sim * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${sim * 100}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="pt-2 border-t border-[rgba(255,255,255,0.06)] flex justify-between items-center">
        <span className="text-xs text-[#475569]">Average Agreement</span>
        <span
          className="text-sm font-mono font-bold"
          style={{ color: scoreColor(agreement.score) }}
        >
          {(agreement.score * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
