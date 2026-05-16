import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ModelLogo from '../core/ModelLogo';
import MetricBar from '../viz/MetricBar';
import GlassCard from '../core/GlassCard';
import { MODEL_ROSTER } from '../../utils/modelConfigs';

const METRICS = ['accuracy', 'relevance', 'completeness', 'clarity'];
const METRIC_LABELS = { accuracy: 'Accuracy', relevance: 'Relevance', completeness: 'Completeness', clarity: 'Clarity' };

function stampLabel(avgScore) {
  if (avgScore >= 0.75) return { text: 'VERIFIED ✓', color: '#059669' };
  if (avgScore >= 0.50) return { text: 'REVIEW ⚠',  color: '#D97706' };
  return { text: 'LOW ✗', color: '#E11D48' };
}

function defaultScores() {
  const s = {};
  MODEL_ROSTER.forEach((m) => {
    s[m.id] = {
      accuracy:     +(0.6 + Math.random() * 0.35).toFixed(2),
      relevance:    +(0.6 + Math.random() * 0.35).toFixed(2),
      completeness: +(0.55 + Math.random() * 0.35).toFixed(2),
      clarity:      +(0.6 + Math.random() * 0.35).toFixed(2),
      justification: 'Response demonstrates strong factual grounding with well-structured reasoning.',
    };
  });
  return s;
}

function ModelJudgeRow({ model, scores, modelDelay }) {
  const [showStamp, setShowStamp] = useState(false);
  const avg = METRICS.reduce((s, k) => s + (scores[k] || 0), 0) / METRICS.length;
  const stamp = stampLabel(avg);

  useEffect(() => {
    const t1 = setTimeout(() => setShowStamp(true),  (modelDelay + 0.7 + 0.18) * 1000);
    const t2 = setTimeout(() => setShowStamp(false), (modelDelay + 0.7 + 0.18 + 0.8) * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [modelDelay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: modelDelay, duration: 0.35 }}
      className="relative p-3 rounded-lg space-y-2.5"
      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: model.brandColor }} />
        <ModelLogo id={model.id} size={14} color={model.brandColor} />
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{model.label}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        {METRICS.map((key, i) => (
          <MetricBar
            key={key}
            label={METRIC_LABELS[key]}
            value={scores[key] || 0}
            delay={modelDelay + i * 0.06}
            compact
          />
        ))}
      </div>

      {scores.justification && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: modelDelay + 0.6 }}
          className="text-[11px] italic leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {scores.justification}
        </motion.p>
      )}

      <AnimatePresence>
        {showStamp && (
          <motion.div
            initial={{ scale: 2, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <span
              className="text-3xl font-mono font-bold tracking-widest uppercase"
              style={{ color: stamp.color }}
            >
              {stamp.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function JudgePanel({ data = {} }) {
  const scores = data.scores || defaultScores();
  const models = data.models || MODEL_ROSTER;

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-xs font-mono tracking-widest uppercase">
          <span style={{ color: '#059669' }}>GPT-4o</span>{' '}
          <span style={{ color: 'var(--text-secondary)' }}>Evaluation</span>
        </h3>
        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Independent judge model scoring each response
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {models.map((m, i) => (
          <ModelJudgeRow
            key={m.id}
            model={m}
            scores={scores[m.id] || {}}
            modelDelay={i * 0.2}
          />
        ))}
      </div>
    </GlassCard>
  );
}
