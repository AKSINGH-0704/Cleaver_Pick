import { motion } from 'framer-motion';
import ModelLogo from '../core/ModelLogo';
import Tooltip from '../core/Tooltip';
import GlassCard from '../core/GlassCard';
import { MODEL_ROSTER } from '../../utils/modelConfigs';

// rose(0) → amber(0.5) → green(1) — semantic light-mode palette
function cellColor(v) {
  if (v <= 0.5) {
    const t = v / 0.5;
    const r = Math.round(251 + (251 - 251) * t);
    const g = Math.round(113 + (191 - 113) * t);
    const b = Math.round(133 + (36 - 133) * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = (v - 0.5) / 0.5;
  const r = Math.round(251 + (5 - 251) * t);
  const g = Math.round(191 + (150 - 191) * t);
  const b = Math.round(36 + (105 - 36) * t);
  return `rgb(${r},${g},${b})`;
}

export default function AgreementHeatmap({ data = {} }) {
  const models = data.models || MODEL_ROSTER;
  const matrix = data.matrix || generateDefaultMatrix(models.length);
  const cols = models.length;

  return (
    <GlassCard className="p-5 space-y-4 overflow-x-auto">
      <div className="space-y-1">
        <h3 className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
          Cross-Model Semantic Agreement
        </h3>
        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Cosine similarity between embedding vectors
        </p>
      </div>

      <div className="inline-grid gap-[3px]" style={{ gridTemplateColumns: `auto repeat(${cols}, 1fr)` }}>
        <div />
        {models.map((m) => (
          <div key={`col-${m.id}`} className="flex items-center justify-center pb-1">
            <ModelLogo id={m.id} size={14} color={m.brandColor} />
          </div>
        ))}

        {models.map((rowModel, r) => (
          <div key={`row-${rowModel.id}`} className="contents">
            <div className="flex items-center gap-1.5 pr-2">
              <ModelLogo id={rowModel.id} size={14} color={rowModel.brandColor} />
              <span className="text-[9px] font-mono whitespace-nowrap hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                {rowModel.label.split(' ')[0]}
              </span>
            </div>

            {models.map((colModel, c) => {
              const val = matrix[r]?.[c] ?? 0;
              const isDiag = r === c;
              const delay = (r * cols + c) * 0.03;
              const color = cellColor(val);
              return (
                <Tooltip
                  key={`${r}-${c}`}
                  content={`${rowModel.label} vs ${colModel.label}: ${val.toFixed(2)} similarity`}
                  side="top"
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay, duration: 0.35, ease: 'easeOut' }}
                    whileHover={{ scale: 1.08 }}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center cursor-default"
                    style={{
                      backgroundColor: isDiag ? `${color}40` : `${color}25`,
                      border: isDiag ? `1px solid ${color}80` : '1px solid transparent',
                    }}
                  >
                    <span
                      className="text-[10px] font-mono tabular-nums"
                      style={{ color: isDiag ? '#059669' : color }}
                    >
                      {val.toFixed(2)}
                    </span>
                  </motion.div>
                </Tooltip>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FB71854D' }} />
          Low
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#FBBF244D' }} />
          Moderate
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#34D3994D' }} />
          High
        </span>
      </div>
    </GlassCard>
  );
}

function generateDefaultMatrix(n) {
  const m = [];
  for (let i = 0; i < n; i++) {
    m[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) m[i][j] = 1.0;
      else if (m[j]?.[i] !== undefined) m[i][j] = m[j][i];
      else m[i][j] = +(0.55 + Math.random() * 0.35).toFixed(2);
    }
  }
  return m;
}
