import { motion } from 'framer-motion';
import { getModel } from '../../utils/modelConfigs';
import ModelLogo from '../core/ModelLogo';

// Compact avatar used for dispatch rings / roster strips.
export default function ModelCardMini({
  modelId,
  size = 36,
  pulse = false,
  dim = false,
  ring = true,
}) {
  const cfg = getModel(modelId);
  if (!cfg) return null;
  const isSim = cfg.tier === 'simulated';

  return (
    <motion.div
      className="relative flex flex-col items-center gap-1"
      animate={pulse ? { scale: [1, 1.2, 1] } : {}}
      transition={pulse ? { duration: 0.6, repeat: Infinity, repeatType: 'loop' } : {}}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${cfg.brandColor}33, ${cfg.brandColor}11)`,
          border: ring ? `1.5px solid ${cfg.brandColor}` : 'none',
          boxShadow: ring ? `0 0 10px ${cfg.accentGlow}` : 'none',
          opacity: dim ? 0.55 : 1,
        }}
      >
        <ModelLogo id={cfg.id} size={size * 0.55} color={cfg.brandColor} />
      </div>
      {isSim && (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{ background: '#FFB627', boxShadow: '0 0 4px #FFB627' }}
        />
      )}
    </motion.div>
  );
}
