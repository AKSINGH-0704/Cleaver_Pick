import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../utils/api';
import { scoreColor, MODEL_COLORS, MODEL_LABELS } from '../utils/colors';

const DOMAIN_COLORS = {
  medical:    '#EF476F',
  legal:      '#FFB627',
  code:       '#06D6A0',
  research:   '#118AB2',
  creative:   '#7B61FF',
  analytical: '#4285F4',
  general:    '#94A3B8',
};

const DOMAIN_FILTERS = ['all', 'research', 'medical', 'legal', 'code', 'general', 'creative', 'analytical'];

const MD = [
  'text-xs text-[#94A3B8] leading-relaxed',
  '[&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-[#F1F5F9] [&_h1]:mt-2 [&_h1]:mb-1',
  '[&_h2]:text-xs [&_h2]:font-semibold [&_h2]:text-[#CBD5E1] [&_h2]:mt-2 [&_h2]:mb-1',
  '[&_strong]:text-[#F1F5F9] [&_strong]:font-semibold',
  '[&_code]:font-mono [&_code]:text-[#06D6A0] [&_code]:bg-[rgba(6,214,160,0.08)] [&_code]:px-1 [&_code]:rounded [&_code]:text-[11px]',
  '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1',
  '[&_li]:my-0.5 [&_p]:mb-1.5 [&_p:last-child]:mb-0',
].join(' ');

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const SCORE_KEYS = [
  { key: 'agreement',    label: 'Agreement',    letter: 'A' },
  { key: 'verification', label: 'Verification', letter: 'V' },
  { key: 'evaluation',   label: 'Evaluation',   letter: 'E' },
  { key: 'consistency',  label: 'Consistency',  letter: 'C' },
];

function HistoryCard({ ev, index }) {
  const [open, setOpen] = useState(false);

  const modelColor   = MODEL_COLORS[ev.best_model] || '#7B61FF';
  const rColor       = scoreColor(ev.best_score || 0);
  const domainColor  = DOMAIN_COLORS[ev.domain] || '#94A3B8';
  const breakdown    = ev.score_breakdown || {};
  const bestResponse = ev.best_response || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: 'easeOut' }}
      className="glass-card overflow-hidden"
    >
      {/* Clickable row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
      >
        <span className="text-[#475569] flex-shrink-0">
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
        <span className="flex-1 text-sm text-[#94A3B8] truncate min-w-0">
          {ev.prompt || '—'}
        </span>
        {ev.domain && (
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0 capitalize"
            style={{ color: domainColor, background: domainColor + '18', border: `1px solid ${domainColor}30` }}
          >
            {ev.domain}
          </span>
        )}
        <span className="text-[11px] font-mono flex-shrink-0" style={{ color: modelColor }}>
          {MODEL_LABELS[ev.best_model] || ev.best_model || '—'}
        </span>
        <span className="text-sm font-mono font-bold flex-shrink-0 w-12 text-right" style={{ color: rColor }}>
          {ev.best_score != null ? (ev.best_score * 100).toFixed(1) : '—'}
        </span>
        <span className="text-[10px] text-[#475569] font-mono flex-shrink-0 w-20 text-right">
          {relativeTime(ev.created_at)}
        </span>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[rgba(255,255,255,0.05)] px-4 py-4 space-y-4">
              {/* A/V/E/C breakdown */}
              {Object.keys(breakdown).length > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  {SCORE_KEYS.map(({ key, label, letter }) => {
                    const comp  = breakdown[key] || {};
                    const val   = typeof comp === 'object' ? (comp.value ?? 0) : (comp ?? 0);
                    const pct   = Math.round(val * 100);
                    const color = scoreColor(val);
                    return (
                      <div key={key} className="text-center bg-[rgba(255,255,255,0.02)] rounded-lg py-3 space-y-1">
                        <div className="text-base font-bold" style={{ color, fontFamily: 'Space Mono, monospace' }}>
                          {pct}
                        </div>
                        <div className="text-[9px] font-mono text-[#475569] uppercase tracking-wider">
                          {letter} · {label}
                        </div>
                        <div className="h-0.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden mx-3">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Best response */}
              {bestResponse && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono text-[#475569] uppercase tracking-widest">Best Response</p>
                  <div className="bg-[rgba(255,255,255,0.02)] rounded-xl p-3 border border-[rgba(255,255,255,0.04)] max-h-60 overflow-y-auto">
                    <div className={MD}>
                      <ReactMarkdown>{bestResponse}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {!bestResponse && Object.keys(breakdown).length === 0 && (
                <p className="text-xs text-[#475569] italic">No breakdown available for this evaluation.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [search, setSearch]           = useState('');
  const [domain, setDomain]           = useState('all');
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/history?limit=50`)
      .then(r => r.json())
      .then(d => setEvaluations(d.evaluations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = evaluations.filter(e => {
    const matchSearch = !search || (e.prompt || '').toLowerCase().includes(search.toLowerCase());
    const matchDomain = domain === 'all' || e.domain === domain;
    return matchSearch && matchDomain;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Evaluation History
        </h1>
        <p className="text-sm text-[#475569] mt-1">Click any entry to expand score breakdown and response.</p>
      </div>

      {/* Search bar */}
      <div className="glass-card p-3 flex items-center gap-2">
        <Search size={13} className="text-[#475569] flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prompts..."
          className="bg-transparent text-[#F1F5F9] text-sm outline-none placeholder-[#475569] w-full"
        />
      </div>

      {/* Domain filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {DOMAIN_FILTERS.map(d => {
          const active = domain === d;
          const color  = d === 'all' ? '#94A3B8' : (DOMAIN_COLORS[d] || '#94A3B8');
          return (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className="text-[10px] font-mono px-3 py-1 rounded-full capitalize transition-all duration-200"
              style={active
                ? { color: '#04060B', background: color, border: `1px solid ${color}` }
                : { color, background: color + '18', border: `1px solid ${color}30` }
              }
            >
              {d}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <div className="w-4 h-4 rounded-full border-2 border-[#06D6A0] border-t-transparent animate-spin" />
          <p className="text-sm text-[#475569]">Loading history...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center space-y-3">
          <p className="text-sm text-[#475569]">
            {evaluations.length === 0
              ? 'No evaluation history yet. Start by evaluating a query on the Chat page.'
              : 'No results match your filters.'}
          </p>
          {evaluations.length === 0 && (
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-[#06D6A0] hover:underline">
              Go to Chat page →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev, i) => (
            <HistoryCard key={ev.id || i} ev={ev} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
