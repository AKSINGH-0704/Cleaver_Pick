import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ExternalLink, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { scoreColor, MODEL_COLORS, MODEL_LABELS } from '../utils/colors';
import ScoreGauge from './ScoreGauge';
import ClaimsReport from './ClaimsReport';

const MODEL_LINKS = {
  gpt:    'https://chat.openai.com',
  gemini: 'https://gemini.google.com',
};

const MD_CLASSES = [
  'text-xs text-[#94A3B8] leading-relaxed',
  '[&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-[#F1F5F9] [&_h1]:mt-2 [&_h1]:mb-1',
  '[&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-[#CBD5E1] [&_h2]:mt-2 [&_h2]:mb-1',
  '[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-[#94A3B8] [&_h3]:mt-1.5 [&_h3]:mb-0.5',
  '[&_strong]:text-[#F1F5F9] [&_strong]:font-semibold',
  '[&_code]:font-mono [&_code]:text-[#06D6A0] [&_code]:bg-[rgba(6,214,160,0.08)] [&_code]:px-1 [&_code]:rounded [&_code]:text-[11px]',
  '[&_pre]:bg-[rgba(0,0,0,0.35)] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre]:text-[11px]',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1',
  '[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1',
  '[&_li]:my-0.5',
  '[&_p]:mb-1.5 [&_p:last-child]:mb-0',
].join(' ');

const SCORE_KEYS = [
  { key: 'agreement',    letter: 'A', label: 'Agreement' },
  { key: 'verification', letter: 'V', label: 'Verify' },
  { key: 'evaluation',   letter: 'E', label: 'Evaluate' },
  { key: 'consistency',  letter: 'C', label: 'Consist.' },
];

const PREVIEW_CHARS = 200;

// ── Animated score pill ────────────────────────────────────────────────────
function ScorePill({ letter, label, value, index, size = 'md' }) {
  const color = scoreColor(value ?? 0);
  const pct   = Math.round((value ?? 0) * 100);
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div
        className={`font-mono font-bold leading-none ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        style={{ color, fontFamily: 'Space Mono, monospace' }}
      >
        {pct}
      </div>
      <div className="text-[9px] font-space text-[#475569] uppercase tracking-wider">{letter}</div>
      {/* Animated fill bar */}
      <div className="w-full h-0.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: index * 0.15, ease: 'easeOut' }}
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Quick route button ─────────────────────────────────────────────────────
function QuickRouteButton({ modelKey, prompt, isWinner }) {
  const label = MODEL_LABELS[modelKey] || modelKey;
  const url   = MODEL_LINKS[modelKey] || '#';
  const color = isWinner ? '#06D6A0' : '#475569';

  const handleClick = () => {
    try { navigator.clipboard.writeText(prompt); } catch {}
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      title="Prompt copied to clipboard"
      className="group relative overflow-hidden flex items-center justify-center gap-2 w-full rounded-xl border px-4 py-2.5 text-xs font-mono transition-all duration-300"
      style={{
        borderColor: isWinner ? 'rgba(6,214,160,0.25)' : 'rgba(255,255,255,0.06)',
        color,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = isWinner ? 'rgba(6,214,160,0.5)' : 'rgba(255,255,255,0.15)';
        e.currentTarget.style.boxShadow = isWinner ? '0 0 20px rgba(6,214,160,0.12)' : 'none';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isWinner ? 'rgba(6,214,160,0.25)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      Continue in {label}
      <motion.span
        className="inline-flex items-center"
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight size={12} />
      </motion.span>
    </button>
  );
}

// ── Single model card ──────────────────────────────────────────────────────
function ModelCard({ model, rank, optimizedPrompt, delayOffset = 0 }) {
  const [expanded, setExpanded] = useState(rank === 0);
  const [showFull, setShowFull] = useState(false);

  const isWinner   = rank === 0;
  const R          = model.composite?.R ?? 0;
  const components = model.composite?.components ?? {};
  const response   = model.response ?? '';
  const isLong     = response.length > PREVIEW_CHARS;
  const modelColor = MODEL_COLORS[model.model] || '#7B61FF';
  const modelLabel = MODEL_LABELS[model.model] || model.model;
  const claims     = model.verification?.claims ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: isWinner ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: delayOffset, ease: 'easeOut' }}
      className={`glass-card overflow-hidden flex flex-col transition-opacity duration-300 ${isWinner ? '' : 'opacity-70 hover:opacity-100'}`}
      style={isWinner ? {} : {}}
    >
      {/* Animated border overlay for winner */}
      {isWinner && (
        <div
          className="winner-card-border absolute inset-0 rounded-2xl pointer-events-none"
          style={{ border: '1px solid #06D6A0', borderRadius: 'inherit' }}
        />
      )}

      {/* Card inner with gradient bg for winner */}
      <div
        className="flex flex-col flex-1 p-5 space-y-4 relative"
        style={isWinner ? { background: 'linear-gradient(135deg, rgba(6,214,160,0.05) 0%, transparent 60%)' } : {}}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Model name + badge */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: modelColor }} />
              <span
                className="font-bold text-[#F1F5F9]"
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: isWinner ? '16px' : '13px' }}
              >
                {modelLabel}
              </span>
              {isWinner ? (
                <span
                  className="shimmer-badge text-[9px] font-space text-[#06D6A0] px-2 py-0.5 rounded-full tracking-widest uppercase"
                  style={{ fontFamily: 'Space Mono, monospace' }}
                >
                  WINNER
                </span>
              ) : (
                <span className="text-[9px] font-space text-[#475569] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full">
                  #2
                </span>
              )}
            </div>

            {/* Insight text */}
            {model.insight && (
              <p
                className="text-[13px] text-[#94A3B8] italic leading-relaxed mt-1"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              >
                {model.insight}
              </p>
            )}
          </div>

          {/* Circular R gauge */}
          <div className="flex-shrink-0">
            <ScoreGauge score={R} size={isWinner ? 88 : 72} label="R" />
          </div>
        </div>

        {/* A/V/E/C score pills */}
        <div className="grid grid-cols-4 gap-2">
          {SCORE_KEYS.map(({ key, letter, label }, i) => {
            const val = components[key]?.value ?? 0;
            return (
              <ScorePill
                key={key}
                letter={letter}
                label={label}
                value={val}
                index={i}
                size={isWinner ? 'md' : 'sm'}
              />
            );
          })}
        </div>

        {/* Collapsible response */}
        <div className="space-y-2">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 text-[10px] font-space text-[#475569] uppercase tracking-widest hover:text-[#94A3B8] transition-colors select-none"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Hide Response' : 'Read Full Response ↓'}
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="response"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ overflow: 'hidden' }}
              >
                <div className="bg-[rgba(255,255,255,0.02)] rounded-xl p-3 border border-[rgba(255,255,255,0.04)]">
                  <div className={MD_CLASSES}>
                    <ReactMarkdown>
                      {isLong && !showFull ? response.slice(0, PREVIEW_CHARS) + '…' : response}
                    </ReactMarkdown>
                  </div>
                  {isLong && (
                    <button
                      onClick={() => setShowFull(f => !f)}
                      className="mt-2 text-[10px] text-[#475569] hover:text-[#06D6A0] transition-colors font-mono"
                    >
                      {showFull ? '▲ show less' : '▼ show more'}
                    </button>
                  )}
                </div>

                {/* Evaluator note */}
                {model.evaluation?.justification && (
                  <p className="mt-2 text-xs text-[#475569] italic border-l-2 border-[rgba(255,255,255,0.06)] pl-3">
                    {model.evaluation.justification}
                  </p>
                )}

                {/* Claims report (only winner shows full report here; runner-up is in WinnerReveal) */}
                {claims.length > 0 && (
                  <div className="mt-3">
                    <ClaimsReport
                      claims={claims}
                      verified={model.verification?.verified ?? 0}
                      partial={model.verification?.partial ?? 0}
                      notFound={model.verification?.not_found ?? 0}
                      compact
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Route button */}
        <div className="pt-1">
          <QuickRouteButton
            modelKey={model.model}
            prompt={optimizedPrompt || ''}
            isWinner={isWinner}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Public component ───────────────────────────────────────────────────────
export default function ModelCompare({ allModels, optimizedPrompt }) {
  if (!allModels?.length) return null;

  const winner   = allModels[0];
  const runnerUp = allModels[1] ?? null;

  return (
    <div className="space-y-3">
      <h2
        className="text-[10px] text-[#475569] uppercase tracking-widest"
        style={{ fontFamily: 'Space Mono, monospace' }}
      >
        Model Intelligence
      </h2>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Winner — 60% */}
        <div className="relative md:basis-[60%]">
          <ModelCard
            model={winner}
            rank={0}
            optimizedPrompt={optimizedPrompt}
            delayOffset={0.2}
          />
        </div>

        {/* Runner-up — 40% */}
        {runnerUp && (
          <div className="md:basis-[40%]">
            <ModelCard
              model={runnerUp}
              rank={1}
              optimizedPrompt={optimizedPrompt}
              delayOffset={0.3}
            />
          </div>
        )}
      </div>
    </div>
  );
}
