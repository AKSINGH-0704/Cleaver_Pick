import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { scoreColor, MODEL_COLORS, MODEL_LABELS } from '../utils/colors';
import ClaimRow from './ClaimRow';

const MD_CLASSES = [
  'text-xs text-[#94A3B8] leading-relaxed',
  '[&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-[#F1F5F9] [&_h1]:mt-2 [&_h1]:mb-1',
  '[&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-[#CBD5E1] [&_h2]:mt-2 [&_h2]:mb-1',
  '[&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-[#94A3B8] [&_h3]:mt-1',
  '[&_strong]:text-[#F1F5F9] [&_strong]:font-semibold',
  '[&_code]:font-mono [&_code]:text-[#06D6A0] [&_code]:bg-[rgba(6,214,160,0.08)] [&_code]:px-1 [&_code]:rounded [&_code]:text-[11px]',
  '[&_pre]:bg-[rgba(0,0,0,0.3)] [&_pre]:rounded [&_pre]:p-2 [&_pre]:overflow-x-auto [&_pre]:my-1.5 [&_pre]:text-[11px]',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1',
  '[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1',
  '[&_li]:my-0.5',
  '[&_p]:mb-1.5 [&_p:last-child]:mb-0',
].join(' ');

const PREVIEW_CHARS = 600;

export default function ModelCard({ model, rank }) {
  const [expanded, setExpanded] = useState(rank === 0);
  const [showFull, setShowFull] = useState(false);

  const R = model.composite?.R ?? 0;
  const color = scoreColor(R);
  const modelColor = MODEL_COLORS[model.model] || '#7B61FF';
  const modelLabel = MODEL_LABELS[model.model] || model.model;
  const isWinner = rank === 0;
  const response = model.response ?? '';
  const isLong = response.length > PREVIEW_CHARS;

  return (
    <motion.div
      layout
      className="glass-card glass-card-hover overflow-hidden"
      style={isWinner ? { borderColor: 'rgba(6,214,160,0.35)' } : {}}
    >
      {/* Card header — always visible */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Rank badge */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            backgroundColor: isWinner ? 'rgba(6,214,160,0.12)' : 'rgba(255,255,255,0.05)',
            color: isWinner ? '#06D6A0' : '#475569',
          }}
        >
          #{rank + 1}
        </div>

        {/* Model identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: modelColor }} />
            <span className="text-sm font-semibold text-[#F1F5F9]">{modelLabel}</span>
            {isWinner && (
              <span className="text-[9px] font-space bg-[rgba(6,214,160,0.1)] text-[#06D6A0] px-2 py-0.5 rounded-full tracking-wide">
                WINNER
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#475569] font-mono mt-0.5">
            {model.composite?.label}
          </div>
        </div>

        {/* R score */}
        <div className="text-right flex-shrink-0 mr-1">
          <div className="text-2xl font-mono font-bold leading-none" style={{ color }}>
            {(R * 100).toFixed(1)}
          </div>
          <div className="text-[9px] text-[#475569] font-space tracking-widest mt-0.5">R SCORE</div>
        </div>

        {expanded
          ? <ChevronUp size={15} className="text-[#475569] flex-shrink-0" />
          : <ChevronDown size={15} className="text-[#475569] flex-shrink-0" />
        }
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[rgba(255,255,255,0.06)] px-4 pb-4 pt-3 space-y-4">
              {/* A/V/E/C component scores */}
              {model.composite?.components && (
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(model.composite.components).map(([k, v]) => (
                    <div key={k} className="text-center">
                      <div className="text-sm font-mono font-bold" style={{ color: scoreColor(v.value) }}>
                        {(v.value * 100).toFixed(0)}
                      </div>
                      <div className="text-[9px] text-[#475569] font-space uppercase tracking-wider capitalize">
                        {k.slice(0, 5)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Response text with markdown */}
              <div className="bg-[rgba(255,255,255,0.02)] rounded-lg p-3">
                <div className={MD_CLASSES}>
                  <ReactMarkdown>
                    {isLong && !showFull ? response.slice(0, PREVIEW_CHARS) + '…' : response}
                  </ReactMarkdown>
                </div>
                {isLong && (
                  <button
                    onClick={e => { e.stopPropagation(); setShowFull(f => !f); }}
                    className="mt-2 text-[10px] text-[#475569] hover:text-[#06D6A0] transition-colors font-mono"
                  >
                    {showFull ? '▲ show less' : '▼ show more'}
                  </button>
                )}
              </div>

              {/* Evaluator justification */}
              {model.evaluation?.justification && (
                <p className="text-xs text-[#475569] italic border-l-2 border-[rgba(255,255,255,0.08)] pl-3">
                  {model.evaluation.justification}
                </p>
              )}

              {/* Fact checks */}
              {model.verification?.claims?.length > 0 && (
                <div>
                  <p className="text-[10px] font-space text-[#475569] uppercase tracking-widest mb-2">
                    Fact Checks ({model.verification.verified}/{model.verification.total} verified)
                  </p>
                  {model.verification.claims.map((c, i) => (
                    <ClaimRow key={i} claim={c} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
