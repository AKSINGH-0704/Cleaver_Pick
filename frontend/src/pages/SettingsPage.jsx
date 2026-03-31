import { useApp } from '../context/AppContext';
import { RotateCcw } from 'lucide-react';
import { MODEL_LABELS, MODEL_COLORS } from '../utils/colors';

const DEFAULT_WEIGHTS = { A: 0.35, V: 0.30, E: 0.25, C: 0.10 };

const WEIGHT_INFO = [
  { key: 'A', label: 'Agreement (A)',    desc: 'Cross-model semantic similarity',  color: '#06D6A0' },
  { key: 'V', label: 'Verification (V)', desc: 'Factual accuracy vs Wikipedia',    color: '#FFB627' },
  { key: 'E', label: 'Evaluation (E)',   desc: 'LLM judge rubric scoring',          color: '#7B61FF' },
  { key: 'C', label: 'Consistency (C)',  desc: 'Context drift across turns',        color: '#118AB2' },
];

export default function SettingsPage() {
  const { weights, setWeights, enabledModels, setEnabledModels, clearHistory, conversationHistory } = useApp();

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const normalized = Math.abs(total - 1.0) < 0.01;

  const handleWeight = (key, val) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(parseFloat(val).toFixed(2)) }));
  };

  const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-[#F1F5F9]">Settings</h1>

      {/* Reliability weights */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-space text-[#475569] uppercase tracking-widest">
            Reliability Weights
          </h2>
          <button
            onClick={resetWeights}
            className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94A3B8] transition-colors"
          >
            <RotateCcw size={11} /> Reset to defaults
          </button>
        </div>

        <div className="font-mono text-xs text-[#475569] bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
          R = {WEIGHT_INFO.map(({ key }) => `${weights[key].toFixed(2)}·${key}`).join(' + ')}
          {' = '}
          <span style={{ color: normalized ? '#06D6A0' : '#EF476F' }}>
            {total.toFixed(2)}
          </span>
        </div>

        {!normalized && (
          <p className="text-xs text-[#EF476F]">
            Weights must sum to 1.00 (currently {total.toFixed(2)}). Adjust before evaluating.
          </p>
        )}

        <div className="space-y-5">
          {WEIGHT_INFO.map(({ key, label, desc, color }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color }}>{label}</span>
                <span className="text-sm font-mono text-[#F1F5F9]">
                  {(weights[key] * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={weights[key]}
                onChange={e => handleWeight(key, e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: color }}
              />
              <p className="text-[10px] text-[#475569]">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Model toggles */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-[10px] font-space text-[#475569] uppercase tracking-widest">
          Active Models
        </h2>
        <p className="text-xs text-[#475569]">
          Toggle which models participate in evaluations. All three are recommended.
        </p>
        <div className="space-y-3">
          {Object.entries(enabledModels).map(([model, enabled]) => (
            <div key={model} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: MODEL_COLORS[model] || '#475569' }}
                />
                <span className="text-sm text-[#94A3B8]">
                  {MODEL_LABELS[model] || model}
                </span>
              </div>
              <button
                onClick={() => setEnabledModels(prev => ({ ...prev, [model]: !prev[model] }))}
                className="relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0"
                style={{ backgroundColor: enabled ? '#06D6A0' : 'rgba(255,255,255,0.1)' }}
                aria-label={`Toggle ${model}`}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ left: enabled ? '1.25rem' : '0.125rem' }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Conversation context */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-[10px] font-space text-[#475569] uppercase tracking-widest">
          Conversation Context
        </h2>
        <p className="text-xs text-[#475569]">
          {conversationHistory.length} turns stored — used for Consistency (C) scoring.
          Clearing resets the C baseline.
        </p>
        <button
          onClick={clearHistory}
          disabled={conversationHistory.length === 0}
          className="text-xs text-[#EF476F] hover:text-[#f76a8a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Clear conversation history
        </button>
      </div>

      {/* Database schema info */}
      <div className="glass-card p-6 space-y-3">
        <h2 className="text-[10px] font-space text-[#475569] uppercase tracking-widest">
          Supabase Schema
        </h2>
        <p className="text-xs text-[#475569]">Run this SQL in your Supabase dashboard to set up the database:</p>
        <pre className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3 text-[10px] font-mono text-[#94A3B8] overflow-x-auto leading-relaxed">
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
      </div>
    </div>
  );
}
