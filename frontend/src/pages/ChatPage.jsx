import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, RotateCcw } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';
import { useApp } from '../context/AppContext';
import PipelineProgress from '../components/PipelineProgress';
import WinnerReveal from '../components/WinnerReveal';
import HeatmapGrid from '../components/HeatmapGrid';
import PromptAnalysis from '../components/PromptAnalysis';
import ModelCompare from '../components/ModelCompare';

const DOMAINS = [
  { value: 'auto',       label: 'auto (detect)' },
  { value: 'general',    label: 'general' },
  { value: 'medical',    label: 'medical' },
  { value: 'legal',      label: 'legal' },
  { value: 'code',       label: 'code' },
  { value: 'research',   label: 'research' },
  { value: 'creative',   label: 'creative' },
  { value: 'analytical', label: 'analytical' },
];

export default function ChatPage() {
  const [prompt, setPrompt] = useState('');
  const [domain, setDomain] = useState('auto');
  const { evaluate, progress, result, loading, error, reset } = useSSE();
  const { weights, conversationHistory, addToHistory } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    const currentPrompt = prompt;
    await evaluate(currentPrompt, domain, conversationHistory, weights);
  };

  // Save to history after result arrives
  const handleReset = () => {
    if (result) {
      addToHistory(prompt, result.best_model, result.best_response);
    }
    reset();
    setPrompt('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="text-center space-y-1.5">
        <h1 className="text-2xl font-bold text-[#F1F5F9]">Evaluate AI Responses</h1>
        <p className="text-sm text-[#475569]">
          Reliability scored across Agreement · Verification · Evaluation · Consistency
        </p>
      </div>

      {/* Prompt form */}
      <form onSubmit={handleSubmit} className="glass-card p-4 space-y-3">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ask anything — CleverPick detects the domain, optimizes the prompt, queries GPT-4o-mini and Gemini, then ranks by reliability..."
          className="w-full bg-transparent text-[#F1F5F9] placeholder-[#475569] text-sm resize-none outline-none min-h-[96px] leading-relaxed"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e);
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#475569]">Domain:</span>
            <select
              value={domain}
              onChange={e => setDomain(e.target.value)}
              className="bg-[rgba(255,255,255,0.05)] text-[#94A3B8] text-xs px-2 py-1 rounded-lg border border-[rgba(255,255,255,0.06)] outline-none cursor-pointer"
            >
              {DOMAINS.map(d => (
                <option key={d.value} value={d.value} style={{ background: '#0B0E14' }}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {(result || error) && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#94A3B8] px-3 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] transition-colors"
              >
                <RotateCcw size={11} /> New
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 bg-[#06D6A0] text-[#04060B] font-semibold text-sm px-4 py-1.5 rounded-lg hover:bg-[#05c491] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={13} />
              {loading ? 'Evaluating...' : 'Evaluate'}
            </button>
          </div>
        </div>
      </form>

      {/* Pipeline progress */}
      <AnimatePresence>
        {(loading || (progress && !result)) && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <PipelineProgress progress={progress} loading={loading} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-4 text-sm text-[#EF476F]"
            style={{ borderColor: 'rgba(239,71,111,0.3)' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            <WinnerReveal result={result} />
            <PromptAnalysis result={result} />
            <HeatmapGrid agreement={result.agreement_matrix} />
            <ModelCompare allModels={result.all_models} optimizedPrompt={result.optimized_prompt} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
