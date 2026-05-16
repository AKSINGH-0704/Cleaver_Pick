import { motion } from 'framer-motion';
import { scoreColor, getValue } from '../../utils/colors';
import AnimatedNumber from '../core/AnimatedNumber';

// Expects components: { A: {value, label?}|number, V:..., E:..., C:... }
const LABELS = {
  A: { name: 'Agreement',    tint: '#4F46E5' },
  V: { name: 'Verification', tint: '#059669' },
  E: { name: 'Evaluation',   tint: '#D97706' },
  C: { name: 'Consistency',  tint: '#2563EB' },
};

export default function ScoreBreakdown({ components, compact = false }) {
  if (!components) return null;
  const keys = ['A', 'V', 'E', 'C'];

  return (
    <div className={`grid grid-cols-4 ${compact ? 'gap-2' : 'gap-3'}`}>
      {keys.map((k, i) => {
        const v = getValue(components[k]);
        const c = scoreColor(v);
        const meta = LABELS[k];
        return (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i + 0.15, duration: 0.4 }}
            className={`rounded-lg ${compact ? 'p-2' : 'p-3'} text-center`}
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
          >
            <div
              className={`font-mono font-bold ${compact ? 'text-base' : 'text-xl'}`}
              style={{ color: c }}
            >
              <AnimatedNumber value={v * 100} decimals={0} duration={1.0} instant />
            </div>
            <div className="text-[9px] font-mono tracking-widest mt-0.5 uppercase" style={{ color: 'var(--text-muted)' }}>
              {k} · {meta.name}
            </div>
            <div className="h-0.5 w-full rounded-full mt-1.5" style={{ background: 'var(--bg-muted)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: c }}
                initial={{ width: 0 }}
                animate={{ width: `${v * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 + i * 0.08 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
