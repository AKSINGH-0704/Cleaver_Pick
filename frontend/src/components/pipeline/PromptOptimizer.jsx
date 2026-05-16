import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Brain, Sparkles, Cpu } from 'lucide-react';
import { useTypewriter } from '../../hooks/useTypewriter';
import GlassCard from '../core/GlassCard';
import Badge from '../core/Badge';
import { fadeUp } from '../../utils/animations';

export default function PromptOptimizer({ data = {}, stage = 0 }) {
  const {
    rawPrompt = '',
    optimized = '',
    domain = '',
    intent = '',
  } = data;

  const typedOptimized = useTypewriter(optimized, 18, true);

  const hasIntent     = !!intent;
  const hasDomain     = !!domain;
  const hasOptimized  = !!optimized;

  return (
    <GlassCard className="p-5 space-y-4">
      {/* Intent + Domain chips */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-2 flex-wrap"
      >
        {hasIntent ? (
          <Badge tone="violet" icon={<Brain size={10} />} size="sm">
            Intent: {intent}
          </Badge>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full border"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-subtle)' }}
          >
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
            <span className="text-[10px] font-mono tracking-wide" style={{ color: 'var(--text-muted)' }}>Detecting intent…</span>
          </div>
        )}

        {hasDomain ? (
          <Badge tone="cyan" size="sm">
            Domain: {domain}
          </Badge>
        ) : (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full border"
            style={{ borderColor: 'var(--border-default)', background: 'var(--bg-subtle)' }}
          >
            <motion.span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent-mid)' }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: 0.3 }}
            />
            <span className="text-[10px] font-mono tracking-wide" style={{ color: 'var(--text-muted)' }}>Detecting domain…</span>
          </div>
        )}

        {hasIntent && !hasOptimized && (
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full border"
            style={{ background: 'var(--accent-light)', borderColor: 'var(--accent-border)' }}
          >
            <Sparkles size={10} style={{ color: 'var(--accent)' }} />
            <span className="text-[10px] font-mono tracking-wide" style={{ color: 'var(--accent)' }}>Optimizing prompt…</span>
          </div>
        )}
      </motion.div>

      {/* Split panel: raw → optimized */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
        {/* LEFT: raw prompt */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-2"
        >
          <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Your Prompt
          </span>
          <div className="rounded-lg p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>
            <p className="text-sm font-mono leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
              {rawPrompt || '…'}
            </p>
          </div>
        </motion.div>

        {/* CENTER: animated arrow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="hidden md:flex flex-col items-center justify-center gap-1 pt-6"
        >
          <div className="w-16 h-[2px] rounded-full" style={{ background: 'var(--accent-border)' }} />
          <motion.div
            animate={hasOptimized ? {} : { x: [0, 4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <ArrowRight size={16} style={{ color: 'var(--accent)' }} />
          </motion.div>
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            AI Enhancement
          </span>
        </motion.div>

        {/* Mobile arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex md:hidden items-center justify-center gap-2"
        >
          <div className="w-8 h-[2px] rounded-full" style={{ background: 'var(--accent-border)' }} />
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <div className="w-8 h-[2px] rounded-full" style={{ background: 'var(--accent-border)' }} />
        </motion.div>

        {/* RIGHT: optimized prompt */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="space-y-2"
        >
          <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
            Optimized Prompt
          </span>
          <div
            className="rounded-lg p-3 min-h-[60px]"
            style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}
          >
            <AnimatePresence mode="wait">
              {hasOptimized ? (
                <motion.p
                  key="optimized"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-mono leading-relaxed"
                  style={{ color: 'var(--accent)' }}
                >
                  {typedOptimized}
                  {typedOptimized.length < optimized.length && (
                    <motion.span
                      className="inline-block w-[2px] h-3.5 ml-0.5 align-middle"
                      style={{ background: 'var(--accent)' }}
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                    />
                  )}
                </motion.p>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <Cpu size={11} style={{ color: 'var(--accent-mid)' }} />
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>AI optimizing…</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'var(--accent)' }}
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </GlassCard>
  );
}
