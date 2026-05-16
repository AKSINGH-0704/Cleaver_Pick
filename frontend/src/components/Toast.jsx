import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} style={{ color: 'var(--success)' }} />,
  error:   <AlertCircle size={16} style={{ color: 'var(--danger)' }} />,
  info:    <Info size={16} style={{ color: 'var(--accent)' }} />,
};

const BORDER_COLORS = {
  success: 'var(--success)',
  error:   'var(--danger)',
  info:    'var(--accent)',
};

export default function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[400px] pointer-events-auto rounded-xl border-l-4"
            style={{
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card-hover)',
              border: '1px solid var(--border-default)',
              borderLeftColor: BORDER_COLORS[toast.type] || BORDER_COLORS.info,
              borderLeftWidth: 4,
            }}
          >
            {icons[toast.type] || icons.info}
            <span className="text-sm flex-1" style={{ color: 'var(--text-secondary)' }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
