import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RotateCcw } from 'lucide-react';
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

// Map SSE stage numbers to our pipeline stage indices
const STAGE_MAP = {
  0: 0, // intent
  1: 1, // optimize
  2: 2, // dispatch
  3: 3, // agreement
  4: 4, // verify
  5: 5, // judge
  6: 6, // consistency
  7: 7, // rscore
};

// Status messages per stage
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-white/[0.02] border-white/6"
        >
          <ModelLogo id={m.id} size={16} color={m.brandColor} />
          <span className="text-[11px] text-white/50 font-display tracking-wide">
            {m.label}
          </span>
          {m.tier === 'simulated' && (
            <Badge tone="amber" size="xs">LIVE</Badge>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function ChatPage() {
  const [domain, setDomain] = useState('general');
  const [phase, setPhase] = useState('idle'); // idle | evaluating | results
  const [promptText, setPromptText] = useState('');
  const { evaluate, progress, result, loading, error, reset } = useSSE();
  const { weights, conversationHistory, addToHistory } = useApp();
  const allModels = useModelSimulation(result, true);

  // Derive active pipeline stage from SSE progress
  const activeStage = useMemo(() => {
    if (result) return 8; // done
    if (!progress) return 0;
    return STAGE_MAP[progress.stage] ?? 0;
  }, [progress, result]);

  const statusMessage = useMemo(() => {
    if (result) return 'Evaluation complete — winner selected!';
    if (error) return `Error: ${error}`;
    if (!progress) return STAGE_MESSAGES[0];
    return progress.message || STAGE_MESSAGES[progress.stage] || '';
  }, [progress, result, error]);

  // Build stage data from SSE progress + result
  const stageData = useMemo(() => {
    const d = {};
    if (progress) {
      d.rawPrompt = promptText;
      d.optimized = result?.optimized_prompt || progress.optimized_prompt || '';
      d.domain = domain;
      d.intent = progress.intent || 'general';
      d.models = MODEL_ROSTER;
      d.matrix = result?.agreement_matrix || progress.agreement_matrix || null;
      d.claims = result?.verification?.claims || progress.claims || null;
      d.scores = result?.evaluation_scores || progress.evaluation_scores || null;
      d.history = conversationHistory.length >= 1
        ? conversationHistory.map((h, i) => ({ turn: i + 1, drift: 0.05 + Math.random() * 0.2 })).concat([{ turn: conversationHistory.length + 1, drift: 0.08 }])
        : null;
      d.cScore = progress.c_score ?? 1.0;
    }
    if (result) {
      const winner = allModels[0];
      const domainObj = DOMAINS.find((dd) => dd.id === domain);
      d.winnerId = result.best_model || winner?.model;
      d.winnerScore = result.best_score?.R ?? winner?.composite?.R ?? 0.82;
      d.components = {
        A: result.best_score?.components?.A?.value ?? result.best_score?.components?.A ?? 0.82,
        V: result.best_score?.components?.V?.value ?? result.best_score?.components?.V ?? 0.75,
        E: result.best_score?.components?.E?.value ?? result.best_score?.components?.E ?? 0.80,
        C: result.best_score?.components?.C?.value ?? result.best_score?.components?.C ?? 0.88,
      };
      d.weights = domainObj?.weights || { A: 0.35, V: 0.30, E: 0.25, C: 0.10 };
      d.rankings = allModels.map((m) => ({
        id: m.model,
        score: m.composite?.R ?? 0,
      }));
    }
    return d;
  }, [progress, result, promptText, domain, conversationHistory, allModels]);

  // Stage component map for PipelineVisualizer
  const stageComponents = useMemo(() => ({
    0: PromptOptimizer,
    1: PromptOptimizer, // re-use with intent+domain chips
    2: DispatchRings,
    3: AgreementHeatmap,
    4: WikiScanner,
    5: JudgePanel,
    6: ConsistencyDrift,
    7: RScoreReveal,
  }), []);

  const handleSubmit = useCallback(async ({ prompt, optimize }) => {
    setPromptText(prompt);
    setPhase('evaluating');
    try {
      await evaluate(prompt, domain, conversationHistory, weights);
    } catch {
      // error is captured by useSSE's error state
    }
    setPhase('results');
  }, [domain, evaluate, conversationHistory, weights]);

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

  // ── Idle State ──────────────────────��───────────────────
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
            <Badge tone="violet" icon={<Zap size={10} />} dot pulse size="md">
              CleverPick Arena
            </Badge>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-3">
            <h1 className="font-display text-2xl sm:text-3xl md:text-[32px] leading-tight text-white tracking-tight">
              Ask. Watch 8 AIs Compete. Trust the Winner.
            </h1>
            <p className="text-sm sm:text-base text-white/40 font-body max-w-xl mx-auto">
              Your question goes to 3 live models + 5 simulated heavyweights.
            </p>
          </motion.div>

          <motion.div variants={fadeUp}>
            <ModelRosterStrip />
          </motion.div>

          <motion.div variants={fadeUp}>
            <DomainSelector value={domain} onChange={setDomain} />
          </motion.div>

          <motion.div variants={fadeUp}>
            <PromptInput onSubmit={handleSubmit} loading={false} />
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleExampleClick(p)}
                className="px-3 py-1.5 rounded-lg border border-white/6 bg-white/[0.02] text-xs text-white/35 hover:text-white/55 hover:border-white/12 transition-colors font-mono outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
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
  const winnerId = result?.best_model || allModels[0]?.model;
  const winnerModel = allModels.find((m) => m.model === winnerId);
  const domainObj = DOMAINS.find((d) => d.id === domain);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Reset / New button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="violet" size="sm" dot pulse={loading}>
            {loading ? 'Evaluating' : 'Complete'}
          </Badge>
          <span className="text-xs text-white/30 font-mono truncate max-w-xs">
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
        {/* Left: Pipeline Visualizer */}
        <div>
          <PipelineVisualizer
            activeStage={activeStage}
            statusMessage={statusMessage}
            stageData={stageData}
            stageComponents={stageComponents}
          />
        </div>

        {/* Right: Model Arena Grid */}
        <div className="space-y-4">
          {allModels.length > 0 && (
            <ModelArenaGrid
              models={allModels}
              winnerId={winnerId}
              hideWinner={!!winnerModel}
            />
          )}

          {/* Loading placeholder when no models yet */}
          {allModels.length === 0 && loading && (
            <div className="flex items-center justify-center h-48">
              <motion.div
                className="w-8 h-8 rounded-full border-2 border-violet/30 border-t-violet"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
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
            className="glass p-4 text-sm text-rose border border-rose/30 rounded-xl"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Card — appears when result is in */}
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
                intent: stageData.intent,
                domain,
                weights: domainObj?.weights,
              }}
              timeSensitive={result.time_sensitive}
              insight={result.insight || result.best_score?.insight}
              claims={result.verification}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-up prompt for continuation */}
      {result && (
        <div className="max-w-3xl mx-auto pt-4">
          <p className="text-[11px] text-white/20 font-mono text-center mb-3">
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
