import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { X, Copy, Check } from 'lucide-react';
import ModelLogo from './ModelLogo';
import { getModel } from '../../utils/modelConfigs';
import { scoreColor, getValue } from '../../utils/colors';

export default function ResponseModal({ model, onClose }) {
  const [copied, setCopied] = useState(false);
  const cfg = getModel(model?.model);
  const response = model?.response || '';
  const R = getValue(model?.composite?.R);
  const rColor = scoreColor(R);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-start justify-center p-4 md:p-8"
        style={{ background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          className="w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-default)' }}
          >
            <div className="flex items-center gap-3">
              {cfg && <ModelLogo id={cfg.id} size={20} color={cfg.brandColor} />}
              <div>
                <div className="font-sans font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                  {cfg?.label ?? model?.model}
                </div>
                {model?.isSimulated && (
                  <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Simulated</div>
                )}
              </div>
              <div
                className="ml-2 px-2.5 py-1 rounded-lg font-mono font-bold text-sm"
                style={{ background: 'var(--bg-subtle)', color: rColor, border: '1px solid var(--border-default)' }}
              >
                R {(R * 100).toFixed(1)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                style={{
                  background: copied ? 'var(--success-light)' : 'var(--bg-subtle)',
                  color: copied ? 'var(--success)' : 'var(--text-tertiary)',
                  border: `1px solid ${copied ? 'var(--success-border)' : 'var(--border-default)'}`,
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Score strip */}
          {model?.composite?.components && (
            <div
              className="flex flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}
            >
              {[
                { key: 'A', label: 'Agreement',    longKey: 'agreement' },
                { key: 'V', label: 'Verification', longKey: 'verification' },
                { key: 'E', label: 'Evaluation',   longKey: 'evaluation' },
                { key: 'C', label: 'Consistency',  longKey: 'consistency' },
              ].map(({ key, label, longKey }) => {
                const raw = model.composite.components[key] ?? model.composite.components[longKey];
                const val = raw == null ? 0 : typeof raw === 'object' ? (raw.value ?? 0) : raw;
                const pct = Math.round(val * 100);
                return (
                  <div
                    key={key}
                    className="flex-1 py-2.5 text-center"
                    style={{ borderRight: '1px solid var(--border-default)' }}
                  >
                    <div className="font-mono font-bold text-base" style={{ color: scoreColor(val) }}>{pct}</div>
                    <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                      {key} · {label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Response body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 response-modal-body">
            <div className="prose-dark">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-3 flex-shrink-0 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {response.length.toLocaleString()} characters
            </span>
            <button
              onClick={onClose}
              className="text-[11px] font-mono transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              Press Esc to close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
