import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap, Info } from 'lucide-react';
import { MODEL_LABELS } from '../utils/colors';

const COMP_LABELS = {
  agreement:    'Agreement',
  verification: 'Verification',
  evaluation:   'Evaluation',
  consistency:  'Consistency',
};

const DOMAIN_COLORS = {
  medical:    { bg: 'rgba(239,71,111,0.10)', text: '#EF476F' },
  legal:      { bg: 'rgba(255,182,39,0.10)',  text: '#FFB627' },
  code:       { bg: 'rgba(6,214,160,0.10)',   text: '#06D6A0' },
  coding:     { bg: 'rgba(6,214,160,0.10)',   text: '#06D6A0' },
  research:   { bg: 'rgba(66,133,244,0.10)',  text: '#4285F4' },
  creative:   { bg: 'rgba(123,97,255,0.12)',  text: '#7B61FF' },
  analytical: { bg: 'rgba(255,182,39,0.10)',  text: '#FFB627' },
  general:    { bg: 'rgba(255,255,255,0.04)', text: '#475569' },
};

function DomainChip({ domain, label, badge }) {
  const c = DOMAIN_COLORS[domain] ?? DOMAIN_COLORS.general;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded"
      style={{ background: c.bg, color: c.text }}
    >
      {domain}
      {badge && (
        <span className="text-[9px] opacity-70 font-space">{badge}</span>
      )}
    </span>
  );
}

export default function PromptAnalysis({ result }) {
  const [promptOpen, setPromptOpen] = useState(false);
  if (!result) return null;

  const {
    intent,
    detected_domain,
    applied_domain,
    domain_source,
    optimized_prompt,
    optimization_applied,
    optimization_description,
    domain_weights,
    all_models,
    best_score,
  } = result;

  const modelsQueried = all_models?.map(m => MODEL_LABELS[m.model] ?? m.model) ?? [];
  const components    = best_score?.components ?? {};

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-[10px] font-space text-[#475569] uppercase tracking-widest">
        Prompt Analysis
      </h3>

      {/* Row 1: intent / detected domain / applied domain / models */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {intent && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[rgba(123,97,255,0.12)] text-[#7B61FF]">
            intent: {intent}
          </span>
        )}

        {detected_domain && domain_source === 'auto-detected' && (
          <DomainChip domain={detected_domain} label={detected_domain} badge="auto-detected" />
        )}

        {applied_domain && domain_source === 'manually set' && (
          <DomainChip domain={applied_domain} label={applied_domain} badge="manually set" />
        )}

        {/* When auto-detected and domain changed (shouldn't happen, but just in case) */}
        {applied_domain && detected_domain && applied_domain !== detected_domain && (
          <span className="text-[10px] text-[#475569] font-mono">
            override: {detected_domain} → {applied_domain}
          </span>
        )}

        {modelsQueried.map(m => (
          <span
            key={m}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-[rgba(66,133,244,0.10)] text-[#4285F4]"
          >
            {m}
          </span>
        ))}
      </div>

      {/* Row 2: optimization description */}
      <div className="flex items-start gap-2">
        <Zap size={12} className={optimization_applied ? 'text-[#FFB627] mt-0.5 flex-shrink-0' : 'text-[#475569] mt-0.5 flex-shrink-0'} />
        <p className="text-[11px] text-[#475569] leading-relaxed">
          {optimization_description ?? (optimization_applied ? 'Domain framing applied' : 'No optimization — prompt sent as-is')}
        </p>
      </div>

      {/* Row 3: weight grid */}
      {Object.keys(components).length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(components).map(([k, v]) => (
            <div key={k} className="text-center bg-[rgba(255,255,255,0.02)] rounded-lg py-2 px-1">
              <div className="text-sm font-mono font-bold text-[#F1F5F9]">
                {Math.round(v.weight * 100)}%
              </div>
              <div className="text-[9px] font-space text-[#475569] uppercase tracking-wider mt-0.5">
                {k[0].toUpperCase()} · {COMP_LABELS[k] ?? k}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collapsible: optimized prompt */}
      <div className="border-t border-[rgba(255,255,255,0.06)] pt-3">
        <button
          onClick={() => setPromptOpen(o => !o)}
          className="flex items-center justify-between w-full text-left group"
        >
          <span className="text-[10px] font-space text-[#475569] uppercase tracking-widest group-hover:text-[#94A3B8] transition-colors">
            {optimization_applied ? 'Optimized Prompt' : 'Prompt Sent to Models'}
          </span>
          {promptOpen
            ? <ChevronUp size={13} className="text-[#475569]" />
            : <ChevronDown size={13} className="text-[#475569]" />
          }
        </button>

        {promptOpen && (
          <div className="mt-2 bg-[rgba(255,255,255,0.02)] rounded-lg p-3 border border-[rgba(255,255,255,0.04)]">
            {optimization_applied ? (
              <p className="text-xs text-[#94A3B8] leading-relaxed font-mono whitespace-pre-wrap">
                {optimized_prompt}
              </p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Info size={11} className="text-[#475569] flex-shrink-0" />
                  <span className="text-[10px] text-[#475569] italic">No optimization — prompt sent as-is</span>
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed font-mono whitespace-pre-wrap">
                  {optimized_prompt}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
