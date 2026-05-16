import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import ScoreArcGauge from '../viz/ScoreArcGauge';
import ModelLogo from '../core/ModelLogo';
import Badge from '../core/Badge';
import AnimatedNumber from '../core/AnimatedNumber';
import GlassCard from '../core/GlassCard';
import { MODEL_ROSTER, getModel } from '../../utils/modelConfigs';
import { fadeUp, stagger } from '../../utils/animations';

const COMPONENT_META = {
  A: { label: 'Agreement',    color: '#4F46E5' },
  V: { label: 'Verification', color: '#059669' },
  E: { label: 'Evaluation',   color: '#D97706' },
  C: { label: 'Consistency',  color: '#2563EB' },
};

function defaultRankings() {
  return MODEL_ROSTER.map((m) => ({
    id: m.id,
    score: +(0.5 + Math.random() * 0.45).toFixed(2),
  })).sort((a, b) => b.score - a.score);
}

export default function RScoreReveal({ data = {} }) {
  const rankings    = data.rankings    || defaultRankings();
  const winnerId    = data.winnerId    || rankings[0]?.id;
  const winnerScore = data.winnerScore ?? rankings[0]?.score ?? 0.82;
  const components  = data.components  || { A: 0.82, V: 0.75, E: 0.80, C: 0.88 };
  const weights     = data.weights     || { A: 0.35, V: 0.30, E: 0.25, C: 0.10 };
  const winner      = getModel(winnerId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard elevated className="p-6 space-y-6">
        {/* Large gauge */}
        <div className="flex justify-center">
          <ScoreArcGauge score={winnerScore} size={280} label="R SCORE" />
        </div>

        {/* formula display */}
        <div className="flex flex-wrap items-center justify-center gap-1 text-xs font-mono">
          <span style={{ color: 'var(--text-muted)' }}>R =</span>
          {['A', 'V', 'E', 'C'].map((k, i) => (
            <span key={k} className="flex items-center gap-0.5">
              {i > 0 && <span className="mx-1" style={{ color: 'var(--text-muted)' }}>+</span>}
              <span style={{ color: 'var(--text-tertiary)' }}>{weights[k]}×</span>
              <span className="font-bold" style={{ color: COMPONENT_META[k].color }}>
                [<AnimatedNumber value={components[k]} decimals={2} duration={1.2} instant />]
              </span>
            </span>
          ))}
        </div>

        {/* component labels */}
        <div className="flex flex-wrap justify-center gap-3">
          {['A', 'V', 'E', 'C'].map((k) => (
            <span key={k} className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPONENT_META[k].color }} />
              <span style={{ color: 'var(--text-tertiary)' }}>{COMPONENT_META[k].label}</span>
            </span>
          ))}
        </div>

        {/* winner badge */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 18 }}
            className="flex items-center justify-center gap-2"
          >
            <Trophy size={18} style={{ color: 'var(--success)' }} />
            <span className="text-lg font-mono font-bold tracking-wide" style={{ color: 'var(--success)' }}>
              MOST RELIABLE: {winner.label}
            </span>
          </motion.div>
        )}

        {/* ranking list */}
        <motion.div
          variants={stagger(0.06)}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          {rankings.map((entry, i) => {
            const m = getModel(entry.id);
            if (!m) return null;
            const isWinner = entry.id === winnerId;
            return (
              <motion.div
                key={entry.id}
                variants={fadeUp}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{
                  background:  isWinner ? 'var(--success-light)' : 'transparent',
                  border:      isWinner ? '1px solid var(--success-border)' : '1px solid transparent',
                  opacity:     isWinner ? 1 : 0.7,
                }}
              >
                <span className="w-5 text-right text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {i + 1}
                </span>
                <ModelLogo id={m.id} size={16} color={m.brandColor} />
                <span className="flex-1 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {m.label}
                </span>
                {m.tier === 'simulated' && (
                  <Badge tone="muted" size="xs">LIVE</Badge>
                )}
                <span
                  className="text-xs font-mono font-bold tabular-nums"
                  style={{ color: isWinner ? 'var(--success)' : 'var(--text-muted)' }}
                >
                  {(entry.score * 100).toFixed(1)}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
