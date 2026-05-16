import { motion } from 'framer-motion';
import Badge from '../core/Badge';
import GlassCard from '../core/GlassCard';

// low drift (0) = green, high drift (1) = red — semantic light-mode palette
function driftColor(v) {
  if (v <= 0.5) {
    const t = v / 0.5;
    const r = Math.round(5  + (251 - 5)   * t);
    const g = Math.round(150 + (191 - 150) * t);
    const b = Math.round(105 + (36 - 105)  * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = (v - 0.5) / 0.5;
  const r = Math.round(251 + (225 - 251) * t);
  const g = Math.round(191 + (29 - 191)  * t);
  const b = Math.round(36  + (72 - 36)   * t);
  return `rgb(${r},${g},${b})`;
}

function driftLabel(score) {
  if (score >= 0.85) return 'Low Drift';
  if (score >= 0.60) return 'Moderate Drift';
  return 'High Drift';
}

function driftTone(score) {
  if (score >= 0.85) return 'green';
  if (score >= 0.60) return 'amber';
  return 'rose';
}

export default function ConsistencyDrift({ data = {} }) {
  const history = data.history || null;
  const cScore  = data.cScore ?? 1.0;
  const hasHistory = history && history.length >= 2;

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
            Consistency Drift
          </h3>
          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {hasHistory
              ? 'Embedding distance between conversation turns'
              : 'First turn — no consistency comparison available'}
          </p>
        </div>
        <Badge tone={driftTone(cScore)} size="sm">
          C: {cScore.toFixed(2)} — {driftLabel(cScore)}
        </Badge>
      </div>

      {hasHistory ? (
        <div className="space-y-3">
          <div className="relative flex items-end gap-4 px-4 pt-4 pb-2">
            <div
              className="absolute bottom-6 left-4 right-4 h-[1px] rounded-full"
              style={{ background: 'var(--border-default)' }}
            />

            {history.map((entry, i) => {
              const barH = Math.max(8, entry.drift * 80);
              const color = driftColor(entry.drift);
              const isCurrent = i === history.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: barH, opacity: 1 }}
                    transition={{ delay: i * 0.2, duration: 0.5, ease: 'easeOut' }}
                    className="w-6 rounded-t-md"
                    style={{
                      backgroundColor: `${color}30`,
                      borderTop: `2px solid ${color}`,
                    }}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.2 + 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-3 h-3 rounded-full border-2 z-10"
                    style={{
                      backgroundColor: isCurrent ? color : `${color}40`,
                      borderColor: color,
                    }}
                  />
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    Turn {entry.turn}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums" style={{ color }}>
                    {entry.drift.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-2">
          <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>C = 1.0</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Consistency scoring activates from the 2nd conversation turn
          </p>
        </div>
      )}
    </GlassCard>
  );
}
