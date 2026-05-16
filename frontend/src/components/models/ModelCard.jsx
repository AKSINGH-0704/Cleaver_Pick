import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hourglass, AlertCircle, ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getModel } from '../../utils/modelConfigs';
import { scoreColor, statusColor, getValue } from '../../utils/colors';
import { useTypewriter } from '../../hooks/useTypewriter';
import ModelLogo from '../core/ModelLogo';
import Badge from '../core/Badge';
import Tooltip from '../core/Tooltip';
import AnimatedNumber from '../core/AnimatedNumber';
import ResponseModal from '../core/ResponseModal';

function inferState(m) {
  if (m.state) return m.state;
  if (m.error) return 'ERROR';
  if (!m.response) return 'THINKING';
  if (!m.composite?.R && m.composite?.R !== 0) return 'RESPONDED';
  return 'SCORED';
}

const PREVIEW_CHARS = 420;

function ScoreBar({ label, value, fullLabel }) {
  const pct = Math.round(value * 100);
  const color = scoreColor(value);
  return (
    <Tooltip content={`${fullLabel}: ${pct}/100`}>
      <div className="text-center py-1.5 rounded" style={{ background: 'var(--bg-subtle)' }}>
        <div className="font-mono font-bold text-xs" style={{ color }}>
          {pct}
        </div>
        <div className="text-[8px] font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</div>
      </div>
    </Tooltip>
  );
}

function ScoringReason({ model, isWinner }) {
  const justification = model.evaluation?.justification;
  const vClaims = model.verification?.claims || [];
  const verifiedCount = model.verification?.verified ?? 0;
  const partialCount = model.verification?.partial ?? 0;
  const notFoundCount = model.verification?.not_found ?? 0;
  const R = getValue(model.composite?.R);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="pt-2 space-y-2.5" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        {justification && (
          <div>
            <p className="text-[9px] font-mono tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
              Judge's Reasoning
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {justification}
            </p>
          </div>
        )}

        {vClaims.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldCheck size={10} style={{ color: 'var(--success)' }} />
              <p className="text-[9px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Fact Check ({verifiedCount}✓ {partialCount}⚠ {notFoundCount}✗)
              </p>
            </div>
            <div className="space-y-1">
              {vClaims.slice(0, 3).map((c, i) => {
                const color = statusColor(c.status);
                const simPct = Math.round((c.similarity ?? 0) * 100);
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[9px] mt-0.5 flex-shrink-0" style={{ color }}>
                      {c.status === 'verified' ? '✓' : c.status === 'partial' ? '⚠' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] leading-snug truncate" style={{ color: 'var(--text-secondary)' }}>
                        {c.claim}
                      </p>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[9px] transition-colors mt-0.5"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          {c.source} <ExternalLink size={8} />
                        </a>
                      )}
                    </div>
                    {simPct > 0 && (
                      <span className="text-[9px] font-mono flex-shrink-0" style={{ color }}>
                        {simPct}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!justification && vClaims.length === 0 && (
          <p className="text-[10px] italic" style={{ color: 'var(--text-muted)' }}>
            {isWinner
              ? 'Winner — highest composite R score across all evaluation criteria.'
              : `R score ${Math.round(R * 100)} — ranked by Agreement, Verification, Evaluation & Consistency.`}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function ModelCard({
  model,
  rank,
  isWinner = false,
  enableTypewriter = true,
  compact = false,
}) {
  const cfg = getModel(model.model);
  if (!cfg) return null;

  const state = inferState(model);
  const isSim = cfg.tier === 'simulated';
  const R = getValue(model.composite?.R);
  const rColor = scoreColor(R);
  const response = model.response || '';
  const displayed = useTypewriter(response, 12, enableTypewriter && state === 'RESPONDED');
  const textToShow = state === 'RESPONDED' ? displayed : response;
  const [expanded, setExpanded] = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== 'THINKING') return;
    const start = Date.now();
    const id = setInterval(() => setElapsed((Date.now() - start) / 1000), 100);
    return () => clearInterval(id);
  }, [state]);

  const borderColor = isWinner
    ? 'var(--accent-border)'
    : state === 'THINKING'
    ? `${cfg.brandColor}55`
    : 'var(--border-default)';

  const cardOpacity = state === 'QUEUED' ? 0.55 : 1;

  return (
    <motion.div
      layout
      className={`relative rounded-2xl overflow-hidden ${isWinner ? 'winner-card-border' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${borderColor}`,
        boxShadow: isWinner ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
        opacity: cardOpacity,
      }}
      whileHover={
        state === 'SCORED'
          ? { y: -2, boxShadow: 'var(--shadow-card-hover)' }
          : {}
      }
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
    >
      {/* Top accent bar */}
      <motion.div
        className="h-0.5 w-full"
        animate={{ opacity: state === 'QUEUED' ? 0.2 : 1 }}
        style={{ background: isWinner ? 'var(--accent)' : cfg.brandColor }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <motion.div
          className="rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            width: 38,
            height: 38,
            background: `${cfg.brandColor}18`,
            border: `1px solid ${cfg.brandColor}40`,
          }}
          animate={state === 'THINKING' ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 1.2, repeat: state === 'THINKING' ? Infinity : 0 }}
        >
          <ModelLogo id={cfg.id} size={20} color={cfg.brandColor} />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {cfg.label}
            </span>
            {isWinner && state === 'SCORED' && (
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
              >
                #1 WINNER
              </span>
            )}
            {!isWinner && rank != null && state === 'SCORED' && (
              <motion.span
                key={`rank-${rank}`}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
              >
                #{rank + 1}
              </motion.span>
            )}
          </div>
          <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{cfg.provider}</div>
        </div>

        {/* R Score */}
        <div className="flex flex-col items-end gap-1">
          {isSim && <Tooltip content="UI-only visual. Based on real model output variation." side="left">
            <Badge tone="muted" size="xs">SIM</Badge>
          </Tooltip>}
          {!isSim && state !== 'ERROR' && (
            <Badge tone="green" size="xs" dot pulse={state === 'THINKING'}>LIVE</Badge>
          )}
          {state === 'SCORED' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="text-right"
            >
              <div className="font-mono font-bold text-xl leading-none" style={{ color: rColor }}>
                <AnimatedNumber value={R * 100} decimals={1} duration={1.1} instant />
              </div>
              <div className="text-[8px] font-mono tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>
                R SCORE
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 space-y-3">
        {state === 'QUEUED' && (
          <div className="flex items-center gap-2 text-xs font-mono py-4" style={{ color: 'var(--text-muted)' }}>
            <Hourglass size={13} />
            <span>Queued</span>
          </div>
        )}

        {state === 'THINKING' && (
          <>
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <ThinkingDots />
              <span>Thinking</span>
              <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>{elapsed.toFixed(1)}s</span>
            </div>
            <div className="space-y-1.5">
              <div className="h-2 rounded shimmer w-full" />
              <div className="h-2 rounded shimmer w-11/12" />
              <div className="h-2 rounded shimmer w-8/12" />
            </div>
          </>
        )}

        {state === 'ERROR' && (
          <div className="flex items-center gap-2 text-xs font-mono py-3" style={{ color: 'var(--danger)' }}>
            <AlertCircle size={13} />
            <span>Failed to respond</span>
          </div>
        )}

        {(state === 'RESPONDED' || state === 'SCORED') && (
          <>
            {state === 'SCORED' && model.composite?.components && (
              <motion.div
                className="grid grid-cols-4 gap-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.05 }}
              >
                {[
                  { k: 'A', full: 'Agreement' },
                  { k: 'V', full: 'Verification' },
                  { k: 'E', full: 'Evaluation' },
                  { k: 'C', full: 'Consistency' },
                ].map(({ k, full }) => {
                  const c = model.composite.components;
                  const KEY_MAP = { A: 'agreement', V: 'verification', E: 'evaluation', C: 'consistency' };
                  const raw = c[k] ?? c[KEY_MAP[k]];
                  return <ScoreBar key={k} label={k} fullLabel={full} value={getValue(raw)} />;
                })}
              </motion.div>
            )}

            <div
              className="rounded-lg p-2.5 overflow-hidden relative"
              style={{ background: 'var(--bg-subtle)', maxHeight: expanded ? '600px' : '160px' }}
            >
              <div className="prose-dark-compact">
                <ReactMarkdown>
                  {!expanded && textToShow.length > PREVIEW_CHARS
                    ? textToShow.slice(0, PREVIEW_CHARS) + '…'
                    : textToShow}
                </ReactMarkdown>
                {state === 'RESPONDED' && enableTypewriter && (
                  <span
                    className="inline-block w-1 h-3 align-middle animate-pulse ml-0.5"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </div>
              {!expanded && textToShow.length > PREVIEW_CHARS && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
                  style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-subtle))' }}
                />
              )}
            </div>

            {state === 'SCORED' && response.length > PREVIEW_CHARS && (
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setExpanded((v) => !v)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-1 text-[10px] font-mono transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  {expanded ? 'collapse' : 'expand'}
                </motion.button>
                <motion.button
                  onClick={() => setModalOpen(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-[10px] font-mono transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  ▼ view full response
                </motion.button>
              </div>
            )}

            {state === 'RESPONDED' && (
              <div className="flex items-center gap-2 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                <span
                  className="inline-block w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: 'var(--accent-mid)', borderTopColor: 'transparent' }}
                />
                Scoring…
              </div>
            )}

            {state === 'SCORED' && (
              <div>
                <motion.button
                  onClick={() => setShowReason((v) => !v)}
                  whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-1.5 text-[10px] font-mono transition-colors w-full text-left"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  {showReason ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  {isWinner ? 'Why it won' : 'Why this score'}
                </motion.button>
                <AnimatePresence>
                  {showReason && (
                    <ScoringReason model={model} isWinner={isWinner} />
                  )}
                </AnimatePresence>
              </div>
            )}

            {modalOpen && (
              <ResponseModal model={model} onClose={() => setModalOpen(false)} />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingDots() {
  return (
    <span className="inline-flex gap-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: 'var(--accent)' }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}
