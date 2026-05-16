import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { scoreColor } from '../../utils/colors';

export default function MetricBar({
  label,
  value = 0,
  color = null,
  sublabel = null,
  delay = 0,
  compact = false,
  animated = true,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20px' });
  const c = color || scoreColor(value);
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div ref={ref} className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-baseline justify-between">
        <span
          className={`font-mono uppercase tracking-widest ${compact ? 'text-[9px]' : 'text-[10px]'}`}
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </span>
        <span
          className={`font-mono font-bold ${compact ? 'text-xs' : 'text-sm'}`}
          style={{ color: c }}
        >
          {pct.toFixed(0)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: c }}
          initial={{ width: '0%' }}
          animate={{ width: animated && inView ? `${pct}%` : '0%' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
        />
      </div>
      {sublabel && (
        <div className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{sublabel}</div>
      )}
    </div>
  );
}
