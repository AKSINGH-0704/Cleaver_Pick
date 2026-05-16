import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function InsightBadge({ text, delay = 1.2 }) {
  if (!text) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-start gap-2 p-3 rounded-lg"
      style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}
    >
      <Sparkles size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
      <p className="text-[12px] italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </motion.div>
  );
}
