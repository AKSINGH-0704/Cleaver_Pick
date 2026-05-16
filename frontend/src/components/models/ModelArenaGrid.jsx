import { motion, AnimatePresence } from 'framer-motion';
import ModelCard from './ModelCard';
import { modelCardVariant } from '../../utils/animations';

/**
 * Model Arena Grid — competitive display of all 8 models.
 * Live models appear first with stagger, simulated follow with slight delay.
 * Layout animations ensure rank changes feel smooth and intentional.
 */
export default function ModelArenaGrid({
  models = [],
  winnerId = null,
  hideWinner = false,
}) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const liveCount = models.filter((m) => !m.isSimulated).length;
  const visible = hideWinner ? models.filter((m) => m.model !== winnerId) : models;

  return (
    <motion.div
      className="grid-arena"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((m, i) => {
          const isWinner = winnerId === m.model;
          const simDelay = m.isSimulated ? (liveCount + i) * 0.06 : i * 0.06;
          return (
            <motion.div
              key={m.model}
              variants={modelCardVariant}
              custom={i}
              layout
              transition={{
                delay: simDelay,
                layout: { type: 'spring', stiffness: 350, damping: 28 },
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: -10,
                transition: { duration: 0.25 },
              }}
            >
              <ModelCard
                model={m}
                rank={i}
                isWinner={isWinner}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
}
