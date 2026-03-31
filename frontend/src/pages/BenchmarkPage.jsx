import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Play, RotateCcw, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { API_URL } from '../utils/api';
import { scoreColor } from '../utils/colors';

const CACHE_KEY = 'cleverpick_benchmark_results';

const COUNT_OPTIONS = [5, 10, 25, 50];

function statusIcon(status) {
  if (status === 'verified')  return <CheckCircle2 size={12} className="text-[#06D6A0] flex-shrink-0 mt-0.5" />;
  if (status === 'partial')   return <AlertTriangle size={12} className="text-[#FFB627] flex-shrink-0 mt-0.5" />;
  return <XCircle size={12} className="text-[#EF476F] flex-shrink-0 mt-0.5" />;
}

function VBadge({ score }) {
  const color = scoreColor(score);
  const pct   = Math.round(score * 100);
  return (
    <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color }}>
      V: {pct}
    </span>
  );
}

function ResultRow({ r, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="border-b border-[rgba(255,255,255,0.04)] last:border-0"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
      >
        <span className="text-[10px] text-[#475569] font-mono w-5 flex-shrink-0 mt-0.5">{index + 1}</span>
        <span className="flex-1 min-w-0 text-xs text-[#94A3B8] line-clamp-2">{r.question}</span>
        <span
          className="text-[10px] font-mono text-[#475569] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-full flex-shrink-0"
        >
          {r.category}
        </span>
        <VBadge score={r.v_score} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 space-y-3">
              {r.answer && (
                <div className="bg-[rgba(255,255,255,0.02)] rounded-lg p-3 border border-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{r.answer}</p>
                </div>
              )}
              {r.claims?.length > 0 && (
                <div className="space-y-1.5">
                  {r.claims.map((c, ci) => (
                    <div key={ci} className="flex items-start gap-2">
                      {statusIcon(c.status)}
                      <span className="text-[11px] text-[#94A3B8]">{c.claim}</span>
                    </div>
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

export default function BenchmarkPage() {
  const [count, setCount]       = useState(5);
  const [running, setRunning]   = useState(false);
  const [progress, setProgress] = useState(null);   // { index, total, question }
  const [results, setResults]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [error, setError]       = useState(null);
  const [cached, setCached]     = useState(null);   // previously saved run
  const abortRef = useRef(null);

  // Load cached results on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      if (saved) setCached(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const runBenchmark = async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);
    setError(null);
    setProgress({ index: 0, total: count, question: 'Starting…' });

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const resp = await fetch(`${API_URL}/api/benchmark?count=${count}`, {
        method: 'POST',
        signal: ctrl.signal,
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (currentEvent === 'progress') {
                setProgress(data);
              } else if (currentEvent === 'result') {
                setResults(prev => [...prev, data]);
              } else if (currentEvent === 'summary') {
                setSummary(data);
                // Cache results
                const cachePayload = { results: [], summary: data, count, ts: Date.now() };
                // We'll update after we have all results (use ref)
              } else if (currentEvent === 'error') {
                setError(data.message || 'Benchmark failed');
              }
            } catch { /* skip */ }
            currentEvent = null;
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message);
    } finally {
      setRunning(false);
      setProgress(null);
    }
  };

  // Save to cache once we have summary + results
  useEffect(() => {
    if (summary && results.length > 0) {
      const payload = { results, summary, count, ts: Date.now() };
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch { /* ignore */ }
      setCached(payload);
    }
  }, [summary]);

  const activeResults = results.length > 0 ? results : (cached?.results ?? []);
  const activeSummary = summary ?? cached?.summary ?? null;
  const showCached    = results.length === 0 && cached && !running;

  const pct = progress ? Math.round(progress.index / (progress.total || 1) * 100) : 0;
  const hallPct = activeSummary
    ? Math.round(activeSummary.hallucination_rate * 100)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FlaskConical size={22} className="text-[#7B61FF]" />
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            TruthfulQA Benchmark
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Lightweight verification benchmark — GPT-4o-mini answers, Wikipedia fact-check
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <span className="text-sm text-[#94A3B8]">Questions:</span>
        <div className="flex gap-1.5">
          {COUNT_OPTIONS.map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              disabled={running}
              className="w-12 py-1 rounded-lg text-xs font-mono transition-all duration-200 disabled:opacity-40"
              style={count === n
                ? { background: '#7B61FF', color: '#fff' }
                : { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.06)' }
              }
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#475569] flex-1 min-w-0">
          GPT-4o-mini + Wikipedia verification only (no agreement/evaluation — fast &amp; credit-efficient)
        </p>
        <button
          onClick={running ? () => abortRef.current?.abort() : runBenchmark}
          className="flex items-center gap-2 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          style={running
            ? { background: 'rgba(239,71,111,0.12)', color: '#EF476F', border: '1px solid rgba(239,71,111,0.3)' }
            : { background: '#7B61FF', color: '#fff' }
          }
        >
          {running ? <><RotateCcw size={13} className="animate-spin" /> Stop</> : <><Play size={13} /> {showCached ? 'Re-run' : 'Run'} Benchmark</>}
        </button>
      </div>

      {error && <p className="text-sm text-[#EF476F] font-mono">{error}</p>}

      {/* Progress bar */}
      <AnimatePresence>
        {running && progress && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass-card p-4 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-mono text-[#475569]">
              <span>Running question {progress.index + 1} / {progress.total}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[#7B61FF]"
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-xs text-[#475569] truncate">{progress.question}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary stats */}
      {activeSummary && (
        <div className="space-y-3">
          {showCached && (
            <p className="text-[10px] font-mono text-[#475569]">
              Showing cached results from {new Date(cached.ts).toLocaleString()}
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Questions Run',       value: activeSummary.total,                         color: '#94A3B8', suffix: '' },
              { label: 'Avg V Score',         value: Math.round(activeSummary.avg_v_score * 100), color: scoreColor(activeSummary.avg_v_score), suffix: '' },
              { label: 'Hallucinations',      value: activeSummary.hallucination_count,            color: '#EF476F', suffix: '' },
              { label: 'Claims Verified',     value: activeSummary.total_verified,                color: '#06D6A0', suffix: '' },
            ].map(({ label, value, color, suffix }) => (
              <div key={label} className="glass-card p-4" style={{ borderTop: `2px solid ${color}` }}>
                <div className="text-[9px] font-mono text-[#475569] uppercase tracking-widest mb-1">{label}</div>
                <div className="text-2xl font-bold font-mono" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>
                  {value}{suffix}
                </div>
              </div>
            ))}
          </div>

          {/* Verdict */}
          <div className="glass-card p-4 flex items-start gap-3" style={{ borderColor: hallPct > 30 ? 'rgba(239,71,111,0.3)' : 'rgba(6,214,160,0.2)' }}>
            <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" style={{ color: hallPct > 30 ? '#EF476F' : '#06D6A0' }} />
            <p className="text-sm text-[#94A3B8]">
              <span className="font-semibold text-[#F1F5F9]">CleverPick</span> detected potential hallucinations in{' '}
              <span className="font-bold font-mono" style={{ color: hallPct > 30 ? '#EF476F' : '#06D6A0' }}>
                {hallPct}%
              </span>{' '}
              of adversarial TruthfulQA questions
              {activeSummary.total_claims > 0 && (
                <> — verified {activeSummary.total_verified} of {activeSummary.total_claims} total claims</>
              )}.
            </p>
          </div>
        </div>
      )}

      {/* Live results list */}
      {activeResults.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[10px] font-mono text-[#475569] uppercase tracking-widest">
            Results ({activeResults.length})
          </h2>
          <div className="glass-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-[rgba(255,255,255,0.06)]">
              <span className="w-5 text-[9px] text-[#475569] font-mono">#</span>
              <span className="flex-1 text-[9px] text-[#475569] font-mono uppercase tracking-wider">Question</span>
              <span className="text-[9px] text-[#475569] font-mono uppercase tracking-wider">Category</span>
              <span className="text-[9px] text-[#475569] font-mono uppercase tracking-wider">V Score</span>
            </div>
            {activeResults.map((r, i) => (
              <ResultRow key={i} r={r} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
