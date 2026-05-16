import { motion } from 'framer-motion';
import { DOMAINS } from '../../utils/modelConfigs';
import Tooltip from '../core/Tooltip';

function weightLabel(w) {
  return `A ${(w.A * 100).toFixed(0)}%  V ${(w.V * 100).toFixed(0)}%  E ${(w.E * 100).toFixed(0)}%  C ${(w.C * 100).toFixed(0)}%`;
}

export default function DomainSelector({ value = 'general', onChange }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {DOMAINS.map((d) => {
        const active = d.id === value;
        return (
          <Tooltip key={d.id} content={weightLabel(d.weights)}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              onClick={() => onChange?.(d.id)}
              className="relative px-3.5 py-1.5 rounded-full text-xs font-mono tracking-widest uppercase border transition-colors duration-200 outline-none"
              style={{
                background: active ? 'var(--accent-light)' : 'var(--bg-subtle)',
                color: active ? 'var(--accent)' : 'var(--text-tertiary)',
                borderColor: active ? 'var(--accent-border)' : 'var(--border-default)',
                boxShadow: active ? 'none' : 'none',
              }}
            >
              {d.label}
            </motion.button>
          </Tooltip>
        );
      })}
    </div>
  );
}
