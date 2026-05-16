import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import ModelLogo from '../core/ModelLogo';
import { MODEL_ROSTER } from '../../utils/modelConfigs';
import GlassCard from '../core/GlassCard';

const RING_RADIUS = 110;

function getPosition(index, total) {
  const angle = ((2 * Math.PI) / total) * index - Math.PI / 2;
  return {
    x: Math.cos(angle) * RING_RADIUS,
    y: Math.sin(angle) * RING_RADIUS,
  };
}

export default function DispatchRings({ data = {} }) {
  const models = data.models || MODEL_ROSTER;
  const center = { x: 0, y: 0 };

  return (
    <GlassCard className="p-5">
      <div className="flex justify-center">
        <div
          className="relative"
          style={{
            width: RING_RADIUS * 2 + 80,
            height: RING_RADIUS * 2 + 80,
          }}
        >
          {/* SVG lines from center to each model */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`${-(RING_RADIUS + 40)} ${-(RING_RADIUS + 40)} ${(RING_RADIUS + 40) * 2} ${(RING_RADIUS + 40) * 2}`}
          >
            {models.map((m, i) => {
              const pos = getPosition(i, models.length);
              const lineLength = Math.sqrt(
                (pos.x - center.x) ** 2 + (pos.y - center.y) ** 2,
              );
              return (
                <motion.line
                  key={`line-${m.id}`}
                  x1={center.x}
                  y1={center.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke={m.brandColor}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray={lineLength}
                  initial={{ strokeDashoffset: lineLength, opacity: 0.4 }}
                  animate={{ strokeDashoffset: 0, opacity: 0.7 }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: 'easeOut' }}
                />
              );
            })}
          </svg>

          {/* Center prompt box */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            className="absolute flex items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 56,
              height: 38,
            }}
          >
            <div
              className="w-full h-full rounded-lg flex items-center justify-center border-2"
              style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}
            >
              <FileText size={18} style={{ color: 'var(--accent)' }} />
            </div>
          </motion.div>

          {/* Model avatars around the ring */}
          {models.map((m, i) => {
            const pos = getPosition(i, models.length);
            const isSimulated = m.tier === 'simulated';
            return (
              <motion.div
                key={m.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: `calc(50% + ${pos.x}px)`,
                  top: `calc(50% + ${pos.y}px)`,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08 + 0.5, type: 'spring', stiffness: 280, damping: 20 }}
              >
                {/* pulse on arrival */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `2px solid ${m.brandColor}`, opacity: 0.4 }}
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ delay: i * 0.08 + 0.7, duration: 0.6, ease: 'easeOut' }}
                />
                <div
                  className="relative w-9 h-9 rounded-full flex items-center justify-center border"
                  style={{
                    background: isSimulated ? '#FFFBEB' : 'var(--bg-subtle)',
                    borderColor: isSimulated ? '#FDE68A' : `${m.brandColor}40`,
                  }}
                >
                  <ModelLogo id={m.id} size={18} color={m.brandColor} />
                </div>
                <span
                  className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono whitespace-nowrap"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {m.label.split(' ')[0]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
