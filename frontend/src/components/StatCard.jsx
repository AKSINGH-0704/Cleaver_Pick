import { useEffect, useRef } from 'react';
import { motion, useMotionValue, animate, useInView } from 'framer-motion';

/**
 * StatCard — animated KPI tile.
 * Pass `textValue` (string) to show a label instead of a count-up number.
 */
export default function StatCard({ label, value, suffix = '', decimals = 0, accentColor = '#06D6A0', icon: Icon, textValue }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const motionVal = useMotionValue(0);
  const displayRef = useRef(null);

  const isText = textValue !== undefined;

  useEffect(() => {
    if (isText || !isInView) return;
    const target = typeof value === 'number' ? value : parseFloat(value) || 0;
    const ctrl = animate(motionVal, target, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate(v) {
        if (displayRef.current) {
          displayRef.current.textContent = v.toFixed(decimals) + suffix;
        }
      },
    });
    return () => ctrl.stop();
  }, [isInView, isText, value, decimals, suffix]);

  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="glass-card p-5 relative overflow-hidden"
      style={{ borderTop: `2px solid ${accentColor}` }}
    >
      {/* Subtle gradient wash */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${accentColor}08 0%, transparent 55%)` }}
      />

      <div className="relative space-y-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={13} style={{ color: accentColor }} />}
          <span
            className="text-[10px] uppercase tracking-widest text-[#475569]"
            style={{ fontFamily: 'Space Mono, monospace' }}
          >
            {label}
          </span>
        </div>

        {isText ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl font-bold leading-tight truncate"
            style={{ color: accentColor, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {textValue || '—'}
          </motion.div>
        ) : (
          <div
            ref={displayRef}
            className="text-3xl font-bold leading-none"
            style={{ color: accentColor, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {numericValue.toFixed(decimals) + suffix}
          </div>
        )}
      </div>
    </motion.div>
  );
}
