import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MODEL_ROSTER, DOMAINS, liveModels, simulatedModels } from '../utils/modelConfigs';
import GlassCard from '../components/core/GlassCard';
import Badge from '../components/core/Badge';
import ModelLogo from '../components/core/ModelLogo';
import GlowButton from '../components/core/GlowButton';
import ScoreArcGauge from '../components/viz/ScoreArcGauge';
import { fadeUp, stagger } from '../utils/animations';

const DEFAULT_WEIGHTS = { A: 0.35, V: 0.30, E: 0.25, C: 0.10 };
const WEIGHT_INFO = [
  { key: 'A', label: 'Agreement (A)',    desc: 'Cross-model semantic similarity',  color: '#4F46E5' },
  { key: 'V', label: 'Verification (V)', desc: 'Factual accuracy vs Wikipedia',    color: '#059669' },
  { key: 'E', label: 'Evaluation (E)',   desc: 'LLM judge rubric scoring',         color: '#D97706' },
  { key: 'C', label: 'Consistency (C)',  desc: 'Context drift across turns',       color: '#2563EB' },
];

function Toggle({ enabled, onChange, color = '#059669' }) {
  return (
    <button
      onClick={onChange}
      className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 outline-none"
      style={{ backgroundColor: enabled ? color : 'var(--bg-muted)' }}
      role="switch" aria-checked={enabled}
    >
      <motion.span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
        style={{ boxShadow: 'var(--shadow-xs)' }}
        animate={{ left: enabled ? '1.25rem' : '0.125rem' }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />
    </button>
  );
}

function ModelToggleRow({ model, enabled, onChange, disabled = false }) {
  return (
    <div className={`flex items-center justify-between py-2 ${disabled ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-2.5">
        <ModelLogo id={model.id} size={18} color={model.brandColor} />
        <div>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{model.label}</span>
          <span className="text-[10px] ml-2" style={{ color: 'var(--text-muted)' }}>{model.provider}</span>
        </div>
      </div>
      <Toggle enabled={enabled} onChange={disabled ? undefined : onChange} color={model.brandColor} />
    </div>
  );
}

export default function SettingsPage() {
  const { weights, setWeights, enabledModels, setEnabledModels, clearHistory, conversationHistory } = useApp();
  const [simEnabled, setSimEnabled] = useState(() => {
    const init = {};
    simulatedModels.forEach((m) => { init[m.id] = true; });
    return init;
  });

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalized = Math.abs(total - 1.0) < 0.01;

  const handleWeight = (key, val) => setWeights((prev) => ({ ...prev, [key]: parseFloat(parseFloat(val).toFixed(2)) }));
  const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });
  const liveEnabledCount = liveModels.filter((m) => enabledModels[m.id] !== false).length;
  const previewScore = useMemo(() => {
    const ex = { A: 0.82, V: 0.75, E: 0.80, C: 0.88 };
    return ex.A * weights.A + ex.V * weights.V + ex.E * weights.E + ex.C * weights.C;
  }, [weights]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const applyPreset = (domainId) => {
    const d = DOMAINS.find((dd) => dd.id === domainId);
    if (d) { setWeights({ ...d.weights }); setSelectedPreset(domainId); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Configure models, weights, and conversation context</p>
      </div>

      <motion.div variants={stagger(0.1)} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 space-y-3 h-full">
            <div className="flex items-center gap-2">
              <Badge tone="green" size="sm" dot>LIVE MODELS</Badge>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {liveModels.map((m) => {
                const enabled = enabledModels[m.id] !== false;
                const isLast = liveEnabledCount <= 1 && enabled;
                return (
                  <ModelToggleRow key={m.id} model={m} enabled={enabled} disabled={isLast}
                    onChange={() => setEnabledModels((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                  />
                );
              })}
            </div>
            {liveEnabledCount <= 1 && (
              <p className="text-[10px] font-mono" style={{ color: 'var(--warning)' }}>At least 1 live model must remain enabled</p>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeUp}>
          <GlassCard className="p-5 space-y-3 h-full">
            <div className="flex items-center gap-2">
              <Badge tone="cyan" size="sm" dot>LIVE MODELS</Badge>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>These models run UI-side live variations derived from live outputs</p>
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {simulatedModels.map((m) => (
                <ModelToggleRow key={m.id} model={m} enabled={simEnabled[m.id] !== false}
                  onChange={() => setSimEnabled((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                />
              ))}
            </div>
            <p className="text-[9px] font-mono italic" style={{ color: 'var(--text-muted)' }}>
              Live models add visual richness but do not affect real pipeline scores.
            </p>
          </GlassCard>
        </motion.div>
      </motion.div>

      <div className="flex justify-end">
        <GlowButton variant="ghost" size="sm" icon={<RotateCcw size={12} />}
          onClick={() => {
            setEnabledModels({ gpt: true, gemini: true, grok: true });
            const init = {};
            simulatedModels.forEach((m) => { init[m.id] = true; });
            setSimEnabled(init);
          }}
        >
          Reset to defaults
        </GlowButton>
      </div>

      {/* Weight sliders */}
      <GlassCard className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Reliability Weights</h2>
          <GlowButton variant="ghost" size="sm" icon={<RotateCcw size={11} />} onClick={resetWeights}>Reset</GlowButton>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Presets</span>
          <div className="flex flex-wrap gap-1.5">
            {DOMAINS.map((d) => (
              <button
                key={d.id}
                onClick={() => applyPreset(d.id)}
                className="px-3 py-1 rounded-full text-[10px] font-mono tracking-wide uppercase border transition-colors"
                style={{
                  background: selectedPreset === d.id ? 'var(--accent-light)' : 'var(--bg-subtle)',
                  color: selectedPreset === d.id ? 'var(--accent)' : 'var(--text-tertiary)',
                  borderColor: selectedPreset === d.id ? 'var(--accent-border)' : 'var(--border-default)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="font-mono text-xs rounded-lg p-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
          R = {WEIGHT_INFO.map(({ key, color }) => (
            <span key={key}>
              <span style={{ color }}>{weights[key].toFixed(2)}</span>·{key}
              {key !== 'C' ? ' + ' : ''}
            </span>
          ))}
          {' = '}
          <span style={{ color: normalized ? 'var(--success)' : 'var(--danger)' }}>
            {total.toFixed(2)}
          </span>
        </div>

        {!normalized && (
          <p className="text-xs font-mono flex items-center gap-1" style={{ color: 'var(--danger)' }}>
            <Info size={12} /> Weights must sum to 1.00 (currently {total.toFixed(2)})
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6 items-start">
          <div className="space-y-5">
            {WEIGHT_INFO.map(({ key, label, desc, color }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium font-mono" style={{ color }}>{label}</span>
                  <span className="text-sm font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {(weights[key] * 100).toFixed(0)}%
                  </span>
                </div>
                <input type="range" min={0} max={1} step={0.05} value={weights[key]}
                  onChange={(e) => handleWeight(key, e.target.value)}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: color }}
                />
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
          <div className="hidden md:flex flex-col items-center pt-2">
            <ScoreArcGauge score={previewScore} size={140} label="PREVIEW" />
            <p className="text-[9px] font-mono mt-1" style={{ color: 'var(--text-muted)' }}>Example: A=82 V=75 E=80 C=88</p>
          </div>
        </div>
      </GlassCard>

      {/* Conversation context */}
      <GlassCard className="p-5 space-y-3">
        <h2 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Conversation Context</h2>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {conversationHistory.length} turns stored — used for Consistency (C) scoring. Clearing resets the C baseline.
        </p>
        <GlowButton variant="danger" size="sm" onClick={clearHistory} disabled={conversationHistory.length === 0} className="disabled:opacity-30">
          Clear conversation history
        </GlowButton>
      </GlassCard>

      {/* Database schema */}
      <GlassCard className="p-5 space-y-3">
        <h2 className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Supabase Schema</h2>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Run this SQL in your Supabase dashboard to set up the database:</p>
        <pre className="rounded-lg p-3 text-[10px] font-mono overflow-x-auto leading-relaxed" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
{`CREATE TABLE evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    prompt TEXT NOT NULL,
    domain TEXT DEFAULT 'general',
    intent TEXT,
    best_model TEXT NOT NULL,
    best_score FLOAT NOT NULL,
    score_breakdown JSONB,
    claims JSONB,
    all_responses JSONB
);
CREATE INDEX idx_eval_created ON evaluations(created_at DESC);
CREATE INDEX idx_eval_domain ON evaluations(domain);
CREATE INDEX idx_eval_model ON evaluations(best_model);`}
        </pre>
      </GlassCard>
    </div>
  );
}
