import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../../utils/api';
import Badge from '../core/Badge';
import ModelLogo from '../core/ModelLogo';
import GlowButton from '../core/GlowButton';
import DomainSelector from './DomainSelector';
import PromptInput from './PromptInput';
import { PipelineVisualizer } from '../pipeline';
import { PromptOptimizer } from '../pipeline';
import { DispatchRings } from '../pipeline';
import { AgreementHeatmap } from '../pipeline';
import { WikiScanner } from '../pipeline';
import { JudgePanel } from '../pipeline';
import { ConsistencyDrift } from '../pipeline';
import { RScoreReveal } from '../pipeline';
import ModelArenaGrid from '../models/ModelArenaGrid';
import WinnerCard from '../models/WinnerCard';
import { MODEL_ROSTER, DOMAINS, getModel } from '../../utils/modelConfigs';
import { useSSE } from '../../hooks/useSSE';
import { useModelSimulation } from '../../hooks/useModelSimulation';
import { useApp } from '../../context/AppContext';
import { fadeUp, stagger } from '../../utils/animations';

const EXAMPLE_PROMPTS = [
  'Is aspirin safe daily?',
  'Explain recursion',
  'What causes inflation?',
];

const STAGE_MAP = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7,
};

const STAGE_MESSAGES = {
  0: 'Classifying intent and detecting domain…',
  1: 'Optimizing prompt with domain-specific context…',
  2: 'Dispatching to 8 models simultaneously…',
  3: 'Computing cross-model semantic agreement…',
  4: 'Extracting claims and verifying against Wikipedia…',
  5: 'GPT-4o judge scoring each response…',
  6: 'Analyzing consistency drift across conversation…',
  7: 'Computing final R Score and selecting winner…',
};

function ModelRosterStrip() {
  return (
    <motion.div
      variants={stagger(0.05)}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-center gap-2"
    >
      {MODEL_ROSTER.map((m) => (
        <motion.div
          key={m.id}
          variants={fadeUp}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
        >
          <ModelLogo id={m.id} size={16} color={m.brandColor} />
          <span className="text-[11px] font-mono tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            {m.label}
          </span>
          {m.tier === 'simulated' && (
            <Badge tone="muted" size="xs">SIM</Badge>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function ChatPage() {
  const [domain, setDomain] = useState('auto');
  const [phase, setPhase] = useState('idle');
  const [promptText, setPromptText] = useState('');
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState('');
  const { evaluate, progress, result, loading, error, reset } = useSSE();
  const { weights, conversationHistory, addToHistory } = useApp();
  const allModels = useModelSimulation(result, false);

  const activeStage = useMemo(() => {
    if (result) return 8;
    if (!progress) return 0;
    return STAGE_MAP[progress.stage] ?? 0;
  }, [progress, result]);

  const statusMessage = useMemo(() => {
    if (result) return 'Evaluation complete — winner selected!';
    if (error) return `Error: ${error}`;
    if (!progress) return STAGE_MESSAGES[0];
    return progress.message || STAGE_MESSAGES[progress.stage] || '';
  }, [progress, result, error]);

  const stageData = useMemo(() => {
    const d = {};
    d.rawPrompt = promptText;
    if (progress) {
      d.optimized = result?.ai_cleaned_prompt || result?.optimized_prompt
        || progress.ai_cleaned_prompt || progress.optimized_prompt || '';
      d.domain  = progress.applied_domain || result?.applied_domain || result?.domain || domain || 'general';
      d.intent  = progress.intent || result?.intent || '';
      d.models  = MODEL_ROSTER;
      d.matrix  = result?.agreement_matrix || progress.agreement_matrix || null;
      d.claims  = null;
      d.scores  = result?.evaluation_scores || progress.evaluation_scores || null;
      d.history = conversationHistory.length >= 1
        ? conversationHistory.map((h, i) => ({ turn: i + 1, drift: 0.05 + Math.random() * 0.2 }))
            .concat([{ turn: conversationHistory.length + 1, drift: 0.08 }])
        : null;
      d.cScore = progress.c_score ?? 1.0;
    }
    if (result) {
      const winner = allModels[0];
      const appliedDomain = result.applied_domain || result.domain || domain;
      const domainObj = DOMAINS.find((dd) => dd.id === appliedDomain);
      d.domain  = appliedDomain;
      d.intent  = result.intent || progress?.intent || '';
      d.winnerId    = result.best_model || winner?.model;
      d.winnerScore = result.best_score?.R ?? winner?.composite?.R ?? 0.82;
      const bc = result.best_score?.components || {};
      d.components = {
        A: bc.agreement?.value    ?? bc.A?.value    ?? bc.A    ?? 0,
        V: bc.verification?.value ?? bc.V?.value    ?? bc.V    ?? 0,
        E: bc.evaluation?.value   ?? bc.E?.value    ?? bc.E    ?? 0,
        C: bc.consistency?.value  ?? bc.C?.value    ?? bc.C    ?? 0,
      };
      d.weights  = domainObj?.weights || { A: 0.35, V: 0.30, E: 0.25, C: 0.10 };
      d.rankings = allModels.map((m) => ({ id: m.model, score: m.composite?.R ?? 0 }));
    }
    return d;
  }, [progress, result, promptText, domain, conversationHistory, allModels]);

  const stageComponents = useMemo(() => ({
    0: PromptOptimizer,
    1: PromptOptimizer,
    2: DispatchRings,
    3: AgreementHeatmap,
    4: WikiScanner,
    5: JudgePanel,
    6: ConsistencyDrift,
    7: RScoreReveal,
  }), []);

  const handleOptimize = useCallback(async (rawText) => {
    setOptimizing(true);
    setVariants([]);
    setSelectedVariant(null);
    setOptimizeError('');
    try {
      const res = await fetch(`${API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: rawText, domain }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const v = data.variants || [];
      if (v.length === 0) throw new Error('No variants returned');
      setVariants(v);
    } catch {
      setOptimizeError('Could not generate variants. Try evaluating directly.');
    } finally {
      setOptimizing(false);
    }
  }, [domain]);

  const handleSubmit = useCallback(async ({ prompt, optimize }) => {
    const promptToUse = selectedVariant?.prompt || prompt;
    setPromptText(promptToUse);
    setVariants([]);
    setSelectedVariant(null);
    setPhase('evaluating');
    try {
      await evaluate(promptToUse, domain, conversationHistory, weights);
    } catch {
      // error captured by useSSE
    }
    setPhase('results');
  }, [domain, evaluate, conversationHistory, weights, selectedVariant]);

  const handleReset = useCallback(() => {
    if (result) {
      addToHistory(promptText, result.best_model, result.best_response);
    }
    reset();
    setPhase('idle');
    setPromptText('');
  }, [result, promptText, addToHistory, reset]);

  const handleExampleClick = useCallback((p) => {
    handleSubmit({ prompt: p, optimize: true });
  }, [handleSubmit]);

  // ── Idle State ──────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl space-y-8 text-center"
        >
          <motion.div variants={fadeUp} className="flex justify-center">
            <Badge tone="cyan" icon={<Zap size={10} />} dot pulse size="md">
              CleverPick Arena
            </Badge>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-3">
            <h1 className="text-2xl sm:text-3xl md:text-[32px] leading-tight tracking-tight font-bold" style={{ color: 'var(--text-primary)' }}>
              Ask. Watch 8 AIs Compete. Trust the Winner.
            </h1>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Your question goes to 3 live models — GPT-4o-mini, Gemini 2.5 Flash, and Llama 3.3 70B.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ModelRosterStrip />
          </motion.div>

          <motion.div variants={fadeUp}>
            <DomainSelector value={domain} onChange={setDomain} />
          </motion.div>

          <motion.div variants={fadeUp}>
            <PromptInput
              onSubmit={handleSubmit}
              onOptimize={handleOptimize}
              optimizing={optimizing}
              loading={false}
            />
          </motion.div>

          <AnimatePresence>
            {optimizeError && (
              <motion.p
                key="opt-err"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-[12px] font-mono"
                style={{ color: 'var(--danger)' }}
              >
                {optimizeError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Variant selection cards */}
          <AnimatePresence>
            {variants.length > 0 && (
              <motion.div
                key="variants"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-3xl mx-auto space-y-3"
              >
                <p className="text-center text-[13px] font-mono tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Select an optimized prompt:
                </p>
                {variants.map((v, idx) => {
                  const isSelected = selectedVariant?.style === v.style;
                  return (
                    <motion.button
                      key={v.style}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => setSelectedVariant(isSelected ? null : v)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full text-left p-5 rounded-xl border transition-all duration-200 outline-none"
                      style={{
                        background: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                        borderColor: isSelected ? 'var(--accent-border)' : 'var(--border-default)',
                        boxShadow: isSelected ? 'var(--shadow-card)' : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className="text-[10px] font-mono tracking-[0.18em] uppercase"
                          style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                        >
                          {v.style}
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={14} style={{ color: 'var(--accent)' }} className="shrink-0" />
                        )}
                      </div>
                      <p
                        className="text-sm text-center leading-relaxed"
                        style={{ color: isSelected ? 'var(--accent)' : 'var(--text-secondary)' }}
                      >
                        {v.prompt}
                      </p>
                    </motion.button>
                  );
                })}
                {selectedVariant && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-[11px] font-mono"
                    style={{ color: 'var(--accent)' }}
                  >
                    ✓ {selectedVariant.style} selected — click Evaluate to run
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleExampleClick(p)}
                className="px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors outline-none"
                style={{ borderColor: 'var(--border-default)', background: 'var(--bg-card)', color: 'var(--text-muted)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                "{p}"
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Evaluating + Results State ──────────────────────────
  const winnerId    = result?.best_model || allModels[0]?.model;
  const winnerModel = allModels.find((m) => m.model === winnerId);
  const appliedDomain = result?.applied_domain || result?.domain || domain;
  const domainObj   = DOMAINS.find((d) => d.id === appliedDomain) || DOMAINS.find((d) => d.id === 'general');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="cyan" size="sm" dot pulse={loading}>
            {loading ? 'Evaluating' : 'Complete'}
          </Badge>
          <span className="text-xs font-mono truncate max-w-xs" style={{ color: 'var(--text-muted)' }}>
            "{promptText.slice(0, 60)}{promptText.length > 60 ? '…' : ''}"
          </span>
        </div>
        <GlowButton
          variant="ghost"
          size="sm"
          onClick={handleReset}
          icon={<RotateCcw size={12} />}
        >
          New Query
        </GlowButton>
      </div>

      {/* Pipeline + Arena layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr_3fr] gap-6">
        <div>
          <PipelineVisualizer
            activeStage={activeStage}
            statusMessage={statusMessage}
            stageData={stageData}
            stageComponents={stageComponents}
          />
        </div>

        <div className="space-y-4">
          {allModels.length > 0 && (
            <>
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Model Rankings
                </span>
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {allModels.length} models · sorted by R score
                </span>
              </div>
              <ModelArenaGrid
                models={allModels}
                winnerId={winnerId}
                hideWinner={false}
              />
            </>
          )}

          {allModels.length === 0 && loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: 'var(--accent-light)', borderTopColor: 'var(--accent)' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Waiting for model responses…</p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 text-sm rounded-xl"
            style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: 'var(--danger)' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Card */}
      <AnimatePresence>
        {winnerModel && result && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <WinnerCard
              model={winnerModel}
              promptMeta={{
                intent: stageData.intent || result?.intent,
                domain: appliedDomain,
                weights: domainObj?.weights,
              }}
              timeSensitive={result.time_sensitive}
              insight={result.insight || result.best_score?.insight}
              claims={winnerModel?.verification ?? null}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-up prompt */}
      {result && (
        <div className="max-w-3xl mx-auto pt-4">
          <p className="text-[11px] font-mono text-center mb-3" style={{ color: 'var(--text-muted)' }}>
            Ask a follow-up to continue the conversation (consistency scoring will activate)
          </p>
          <PromptInput
            onSubmit={handleSubmit}
            loading={loading}
            placeholder="Ask a follow-up question…"
          />
        </div>
      )}
    </div>
  );
}
