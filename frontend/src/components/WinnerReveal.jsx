import { motion } from 'framer-motion';
import { Trophy, Sparkles, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { scoreColor, scoreLabel, MODEL_COLORS, MODEL_LABELS } from '../utils/colors';
import ScoreGauge from './ScoreGauge';
import ScoreBreakdown from './ScoreBreakdown';
import ClaimsReport from './ClaimsReport';

const MD_CLASSES = [
  'text-sm text-[#94A3B8] leading-relaxed',
  '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#F1F5F9] [&_h1]:mt-3 [&_h1]:mb-1',
  '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#F1F5F9] [&_h2]:mt-3 [&_h2]:mb-1',
  '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[#CBD5E1] [&_h3]:mt-2 [&_h3]:mb-1',
  '[&_strong]:text-[#F1F5F9] [&_strong]:font-semibold',
  '[&_em]:text-[#94A3B8] [&_em]:italic',
  '[&_code]:font-mono [&_code]:text-[#06D6A0] [&_code]:bg-[rgba(6,214,160,0.08)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs',
  '[&_pre]:bg-[rgba(0,0,0,0.3)] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1',
  '[&_li]:my-0.5',
  '[&_p]:mb-2 [&_p:last-child]:mb-0',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-[rgba(255,255,255,0.12)] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-[#475569]',
].join(' ');

export default function WinnerReveal({ result }) {
  if (!result) return null;
  const { best_model, best_score, best_response, applied_domain, domain, intent, all_models,
          time_sensitive, time_sensitive_disclaimer } = result;
  const displayDomain = applied_domain || domain;
  const R = best_score?.R ?? 0;
  const modelColor = MODEL_COLORS[best_model] || '#7B61FF';
  const modelLabel = MODEL_LABELS[best_model] || best_model;
  const components = best_score?.components ?? {};

  const winnerData = all_models?.[0] ?? {};
  const claims     = winnerData.verification?.claims ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card p-6 space-y-5"
      style={{ borderColor: 'rgba(6,214,160,0.3)' }}
    >
      {/* Winner header */}
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }}
          className="p-2.5 rounded-xl bg-[rgba(6,214,160,0.1)] flex-shrink-0"
        >
          <Trophy size={22} className="text-[#06D6A0]" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: modelColor }} />
            <h2
              className="text-xl font-bold text-[#F1F5F9]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {modelLabel}
            </h2>
            <Sparkles size={14} className="text-[#FFB627]" />
          </div>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            {scoreLabel(R)}
            {displayDomain && <> &middot; <span className="font-mono text-xs">{displayDomain}</span></>}
            {intent && <> &middot; <span className="font-mono text-xs">{intent}</span></>}
          </p>
        </div>

        <div className="flex-shrink-0">
          <ScoreGauge score={R} size={110} label="R Score" />
        </div>
      </div>

      {/* Prompt analysis strip */}
      {(intent || displayDomain || Object.keys(components).length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {intent && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(123,97,255,0.12)] text-[#7B61FF]">
              intent: {intent}
            </span>
          )}
          {displayDomain && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(6,214,160,0.08)] text-[#06D6A0]">
              domain: {displayDomain}
            </span>
          )}
          {Object.entries(components).map(([k, v]) => (
            <span key={k} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(255,255,255,0.04)] text-[#475569]">
              {k[0].toUpperCase()}={Math.round(v.weight * 100)}%
            </span>
          ))}
        </div>
      )}

      {/* Time-sensitivity disclaimer */}
      {time_sensitive && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex items-start gap-3 bg-[rgba(255,182,39,0.06)] border border-[rgba(255,182,39,0.2)] rounded-xl px-4 py-3"
        >
          <Clock size={14} className="text-[#FFB627] flex-shrink-0 mt-0.5" />
          <p className="text-xs font-mono text-[#FFB627] leading-relaxed">
            {time_sensitive_disclaimer || "This query may involve recent events beyond the models\u2019 training data. Scores reflect consistency with available knowledge sources, not real-time accuracy."}
          </p>
        </motion.div>
      )}

      {/* Score breakdown grid */}
      <ScoreBreakdown components={components} />

      {/* Fact verification report */}
      {claims.length > 0 && (
        <ClaimsReport
          claims={claims}
          verified={winnerData.verification?.verified ?? 0}
          partial={winnerData.verification?.partial ?? 0}
          notFound={winnerData.verification?.not_found ?? 0}
        />
      )}

      {/* Best response */}
      <div className="space-y-2">
        <p className="text-[10px] font-space text-[#475569] uppercase tracking-widest">Best Response</p>
        <div className="bg-[rgba(255,255,255,0.02)] rounded-xl p-4 border border-[rgba(255,255,255,0.04)]">
          <div className={MD_CLASSES}>
            <ReactMarkdown>{best_response}</ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
