import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} className="text-[#06D6A0]" />,
  error:   <AlertCircle size={16} className="text-[#EF476F]" />,
  info:    <Info size={16} className="text-[#7B61FF]" />,
};

const borders = {
  success: 'border-l-[#06D6A0]',
  error:   'border-l-[#EF476F]',
  info:    'border-l-[#7B61FF]',
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
            className={`glass-card border-l-4 ${borders[toast.type] || borders.info} px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-[400px] pointer-events-auto`}
          >
            {icons[toast.type] || icons.info}
            <span className="text-sm text-[#F1F5F9] flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#475569] hover:text-[#94A3B8] transition-colors"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
