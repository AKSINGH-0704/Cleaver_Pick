import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import GlowButton from '../core/GlowButton';

const MAX_CHARS = 2000;

export default function PromptInput({
  onSubmit,
  onOptimize,
  optimizing = false,
  loading = false,
  placeholder = 'Ask anything — 8 models will compete to give you the most reliable answer…',
}) {
  const [text, setText] = useState('');
  const [optimize, setOptimize] = useState(true);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [text]);

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;
  const hasText = !!text.trim();
  const hasTwoButtons = !!onOptimize;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || overLimit || loading) return;
    onSubmit?.({ prompt: trimmed, optimize });
  };

  const handleOptimizeClick = () => {
    const trimmed = text.trim();
    if (!trimmed || overLimit || optimizing || loading) return;
    onOptimize?.(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* Textarea wrapper */}
      <div
        className="relative rounded-xl"
        style={{
          background: 'var(--bg-card)',
          border: `1.5px solid ${focused ? 'var(--accent-mid)' : 'var(--border-default)'}`,
          boxShadow: focused ? '0 0 0 3px var(--accent-light)' : 'var(--shadow-xs)',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}
      >
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          disabled={loading}
          className="w-full resize-none bg-transparent px-4 pt-4 pb-10 text-sm outline-none leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        />

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 pb-2.5">
          {!hasTwoButtons && (
            <motion.button
              type="button"
              onClick={() => setOptimize((v) => !v)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono tracking-wide uppercase outline-none border transition-colors"
              style={{
                background: optimize ? 'var(--accent-light)' : 'var(--bg-subtle)',
                color: optimize ? 'var(--accent)' : 'var(--text-muted)',
                borderColor: optimize ? 'var(--accent-border)' : 'var(--border-default)',
              }}
            >
              <Sparkles size={12} />
              Optimize Prompt
            </motion.button>
          )}

          <span
            className="text-[11px] font-mono tabular-nums ml-auto"
            style={{ color: overLimit ? 'var(--danger)' : 'var(--text-muted)' }}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {hasTwoButtons ? (
        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={handleOptimizeClick}
            disabled={!hasText || overLimit || optimizing || loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors outline-none"
            style={{
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-strong)',
            }}
          >
            {optimizing ? (
              <motion.span
                className="inline-block w-3.5 h-3.5 rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'var(--accent-mid)', borderTopColor: 'transparent' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : (
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
            )}
            {optimizing ? 'Optimizing…' : 'Optimize'}
          </motion.button>

          <GlowButton
            variant="primary" size="lg"
            onClick={handleSubmit}
            disabled={!hasText || overLimit || loading}
            className="flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
            icon={loading ? undefined : <Send size={16} />}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.span
                  className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent border-white/40"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                Evaluating…
              </span>
            ) : 'Evaluate'}
          </GlowButton>
        </div>
      ) : (
        <GlowButton
          variant="primary" size="lg"
          onClick={handleSubmit}
          disabled={!hasText || overLimit || loading}
          className="w-full disabled:opacity-40 disabled:cursor-not-allowed"
          icon={loading ? undefined : <Send size={16} />}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <motion.span
                className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent border-white/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              Evaluating…
            </span>
          ) : 'Evaluate 8 Models →'}
        </GlowButton>
      )}
    </div>
  );
}
