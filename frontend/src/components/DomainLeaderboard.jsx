import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MODEL_COLORS, scoreColor } from '../utils/colors';

const DOMAIN_COLORS = {
  medical:    '#EF476F',
  legal:      '#FFB627',
  code:       '#06D6A0',
  research:   '#118AB2',
  creative:   '#7B61FF',
  analytical: '#4285F4',
  general:    '#94A3B8',
};

function DomainPill({ domain }) {
  const color = DOMAIN_COLORS[domain] || '#94A3B8';
  return (
    <span
      className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full capitalize"
      style={{ color, background: color + '18', border: `1px solid ${color}30` }}
    >
      {domain}
    </span>
  );
}

function WinRateBar({ rate, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-mono" style={{ color }}>{rate}%</span>
    </div>
  );
}

const rowVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.3, delay: i * 0.08, ease: 'easeOut' },
  }),
};

export default function DomainLeaderboard({ leaderboard = [] }) {
  if (!leaderboard.length) {
    return (
      <div className="glass-card p-8 text-center space-y-2">
        <p className="text-sm text-[#475569]">No domain data yet.</p>
        <Link to="/" className="text-xs text-[#06D6A0] hover:underline">
          Run an evaluation to see the leaderboard →
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_1fr_140px_80px_60px] gap-3 px-5 py-3 border-b border-[rgba(255,255,255,0.04)]">
        {['Domain', 'Top Model', 'Win Rate', 'Avg R', 'Total'].map(h => (
          <span
            key={h}
            className="text-[9px] uppercase tracking-widest text-[#475569]"
            style={{ fontFamily: 'Space Mono, monospace' }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {leaderboard.map((row, i) => {
        const modelColor = MODEL_COLORS[row.top_model] || '#94A3B8';
        const rColor = scoreColor(row.avg_r);
        return (
          <motion.div
            key={row.domain}
            custom={i}
            variants={rowVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-[1fr_1fr_140px_80px_60px] gap-3 items-center px-5 py-3.5 border-b border-[rgba(255,255,255,0.03)] last:border-0 hover:bg-[rgba(255,255,255,0.015)] transition-colors"
          >
            {/* Domain */}
            <div className="flex items-center gap-2">
              <DomainPill domain={row.domain} />
              {row.limited_data && (
                <span className="text-[9px] text-[#475569] italic">(limited)</span>
              )}
            </div>

            {/* Top Model */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: modelColor }} />
              <span
                className="text-xs text-[#94A3B8] truncate"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {row.top_model_label || '—'}
              </span>
            </div>

            {/* Win Rate bar */}
            <WinRateBar rate={row.win_rate} color={modelColor} />

            {/* Avg R */}
            <span
              className="text-sm font-bold font-mono"
              style={{ color: rColor, fontFamily: 'Space Mono, monospace' }}
            >
              {(row.avg_r * 100).toFixed(1)}
            </span>

            {/* Total */}
            <span className="text-xs text-[#475569] font-mono">{row.total}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
