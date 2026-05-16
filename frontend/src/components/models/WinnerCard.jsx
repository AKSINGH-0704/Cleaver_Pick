import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Trophy, Copy, Check, AlertTriangle } from 'lucide-react';
import { getModel } from '../../utils/modelConfigs';
import { scoreColor } from '../../utils/colors';
import { winnerSpring } from '../../utils/animations';
import ModelLogo from '../core/ModelLogo';
import Badge from '../core/Badge';
import ScoreArcGauge from '../viz/ScoreArcGauge';
import ScoreBreakdown from '../viz/ScoreBreakdown';
import InsightBadge from '../viz/InsightBadge';
import ClaimsReport from '../ClaimsReport';
import ResponseModal from '../core/ResponseModal';

export default function WinnerCard({
  model,
  promptMeta = null,
  timeSensitive = false,
  insight = null,
  claims = null,
  onContinue = null,
}) {
  const cfg = getModel(model.model);
  if (!cfg) return null;

  const R = model.composite?.R || 0;
  const rColor = scoreColor(R);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const response = model.response || '';
  const isLong = response.length > 900;

  const copy = () => {
    navigator.clipboard?.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      transition={winnerSpring}
      className="relative rounded-2xl overflow-hidden winner-card-border"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-card-hover)' }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: 'var(--accent)' }} />

      <div className="p-5 pl-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.2 }}
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}
            >
              <Trophy size={20} style={{ color: 'var(--accent)' }} />
            </motion.div>
            <div>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
                className="text-[10px] font-mono tracking-widest uppercase"
                style={{ color: 'var(--accent)' }}
              >
                Most Reliable Answer
              </motion.div>
              <div className="flex items-center gap-2 mt-0.5">
                <ModelLogo id={cfg.id} size={18} color={cfg.brandColor} />
                <span className="font-mono text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{cfg.label}</span>
                {model.isSimulated && <Badge tone="green" size="xs">LIVE</Badge>}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.4 }}
          >
            <Badge tone="green" size="md">
              <Trophy size={11} /> #1 Winner
            </Badge>
          </motion.div>
        </div>

        {/* Gauge + breakdown */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5 items-center winner-gauge-row"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 250, damping: 25 }}
        >
          <div className="flex flex-col items-center justify-center">
            <ScoreArcGauge score={R} size={200} />
            <div className="text-[10px] font-mono tracking-widest uppercase mt-2" style={{ color: rColor }}>
              {R >= 0.75 ? 'High Reliability' : R >= 0.5 ? 'Moderate' : 'Low — Review'}
            </div>
          </div>
          <ScoreBreakdown components={(() => {
            const c = model.composite?.components || {};
            return {
              A: c.agreement?.value    ?? c.A?.value    ?? c.A    ?? 0,
              V: c.verification?.value ?? c.V?.value    ?? c.V    ?? 0,
              E: c.evaluation?.value   ?? c.E?.value    ?? c.E    ?? 0,
              C: c.consistency?.value  ?? c.C?.value    ?? c.C    ?? 0,
            };
          })()} />
        </motion.div>

        {/* Prompt analysis strip */}
        {promptMeta && (
          <div
            className="flex flex-wrap gap-2 py-2 px-3 rounded-lg text-[11px]"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
          >
            {promptMeta.intent && (
              <span style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Intent:</span>{' '}
                <span className="font-mono">{promptMeta.intent}</span>
              </span>
            )}
            {promptMeta.domain && (
              <span style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Domain:</span>{' '}
                <span className="font-mono">{promptMeta.domain}</span>
              </span>
            )}
            {promptMeta.weights && (
              <span style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Weights:</span>{' '}
                <span className="font-mono">V={(promptMeta.weights.V * 100).toFixed(0)}%</span>
              </span>
            )}
          </div>
        )}

        {/* Time-sensitive warning */}
        {timeSensitive && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="flex items-center gap-2 p-3 rounded-lg text-xs"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: 'var(--warning)' }}
          >
            <AlertTriangle size={14} />
            This query may involve recent events beyond training data.
          </motion.div>
        )}

        {/* Insight */}
        {insight && <InsightBadge text={insight} delay={0.8} />}

        {/* Claims */}
        {claims?.claims?.length > 0 && (
          <ClaimsReport
            claims={claims.claims}
            verified={claims.verified ?? 0}
            partial={claims.partial ?? 0}
            notFound={claims.not_found ?? 0}
          />
        )}

        {/* Response */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-mono tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              Best Response
            </div>
            <motion.button
              onClick={copy}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1 text-[11px] font-mono transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'copied' : 'copy'}
            </motion.button>
          </div>
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
          >
            <div className="prose-dark">
              <ReactMarkdown>
                {isLong ? response.slice(0, 900) + '…' : response}
              </ReactMarkdown>
            </div>
            {isLong && (
              <motion.button
                onClick={() => setModalOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                ▼ view full response
              </motion.button>
            )}
          </div>

          {modalOpen && (
            <ResponseModal model={model} onClose={() => setModalOpen(false)} />
          )}
        </div>

        {/* Live-winner note */}
        {model.isSimulated && (
          <div
            className="text-[11px] italic px-3 py-2 rounded-lg"
            style={{ background: 'var(--accent-light)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}
          >
            Winner is a live model. Actual result is based on live model output variation.
          </div>
        )}
      </div>
    </motion.div>
  );
}
