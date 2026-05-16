import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp, Telescope } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { API_URL } from '../utils/api';
import { scoreColor } from '../utils/colors';
import { MODEL_ROSTER, MODEL_MAP, MODEL_COLORS, MODEL_LABELS } from '../utils/modelConfigs';
import GlassCard from '../components/core/GlassCard';
import Badge from '../components/core/Badge';
import ModelLogo from '../components/core/ModelLogo';
import { fadeUp, stagger } from '../utils/animations';

const DOMAIN_FILTERS = ['all', 'research', 'medical', 'legal', 'code', 'general', 'creative', 'analytical'];
const TIER_FILTERS = ['All', 'Live', 'Live Models'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'score_high', label: 'Highest score' },
  { value: 'score_low', label: 'Lowest score' },
];
const SCORE_KEYS = [
  { key: 'agreement',    label: 'Agreement',    letter: 'A' },
  { key: 'verification', label: 'Verification', letter: 'V' },
  { key: 'evaluation',   label: 'Evaluation',   letter: 'E' },
  { key: 'consistency',  label: 'Consistency',  letter: 'C' },
];

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function HistoryCard({ ev }) {
  const [open, setOpen] = useState(false);
  const rColor = scoreColor(ev.best_score || 0);
  const breakdown = ev.score_breakdown || {};
  const bestResponse = ev.best_response || '';
  const cfg = MODEL_MAP[ev.best_model];

  return (
    <motion.div variants={fadeUp}>
      <GlassCard hover className="overflow-hidden">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors"
          style={{ borderBottom: open ? '1px solid var(--border-subtle)' : 'none' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0">
            {ev.domain && (
              <Badge tone="muted" size="xs">{ev.domain}</Badge>
            )}
            <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {relativeTime(ev.created_at)}
            </span>
          </div>

          <span className="flex-1 text-xs min-w-0 truncate" style={{ color: 'var(--text-secondary)' }}>
            {ev.prompt || '—'}
          </span>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {cfg && <ModelLogo id={cfg.id} size={14} color={cfg.brandColor} />}
            <span className="text-[11px] font-medium" style={{ color: cfg?.brandColor || 'var(--text-tertiary)' }}>
              {MODEL_LABELS[ev.best_model] || ev.best_model || '—'}
            </span>
          </div>

          <span className="text-sm font-mono font-bold flex-shrink-0 w-12 text-right tabular-nums" style={{ color: rColor }}>
            {ev.best_score != null ? (ev.best_score * 100).toFixed(1) : '—'}
          </span>
        </button>

        <div className="flex items-center gap-1 px-4 py-2">
          {MODEL_ROSTER.map((m) => (
            <div key={m.id} style={{ opacity: 0.3 }} title={m.label}>
              <ModelLogo id={m.id} size={12} color={m.brandColor} />
            </div>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 py-4 space-y-4" style={{ background: 'var(--bg-subtle)' }}>
                {Object.keys(breakdown).length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {SCORE_KEYS.map(({ key, label, letter }) => {
                      const comp = breakdown[key] || {};
                      const val = typeof comp === 'object' ? (comp.value ?? 0) : (comp ?? 0);
                      const pct = Math.round(val * 100);
                      const color = scoreColor(val);
                      return (
                        <div key={key} className="text-center rounded-lg py-3 space-y-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                          <div className="text-base font-bold font-mono" style={{ color }}>{pct}</div>
                          <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{letter} · {label}</div>
                          <div className="h-0.5 rounded-full overflow-hidden mx-3" style={{ background: 'var(--bg-muted)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {bestResponse && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Best Response</p>
                    <div className="rounded-xl p-3 max-h-60 overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                      <div className="prose-dark"><ReactMarkdown>{bestResponse}</ReactMarkdown></div>
                    </div>
                  </div>
                )}
                {!bestResponse && Object.keys(breakdown).length === 0 && (
                  <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>No breakdown available for this evaluation.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

export default function HistoryPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('all');
  const [tier, setTier] = useState('All');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/history?limit=50`)
      .then((r) => r.json())
      .then((d) => setEvaluations(d.evaluations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = evaluations
    .filter((e) => {
      const matchSearch = !search || (e.prompt || '').toLowerCase().includes(search.toLowerCase());
      const matchDomain = domain === 'all' || e.domain === domain;
      let matchTier = true;
      if (tier !== 'All') {
        const winnerCfg = MODEL_MAP[e.best_model];
        if (winnerCfg) matchTier = tier === 'Live' ? winnerCfg.tier === 'live' : winnerCfg.tier === 'simulated';
      }
      return matchSearch && matchDomain && matchTier;
    })
    .sort((a, b) => {
      switch (sort) {
        case 'oldest':     return new Date(a.created_at) - new Date(b.created_at);
        case 'score_high': return (b.best_score ?? 0) - (a.best_score ?? 0);
        case 'score_low':  return (a.best_score ?? 0) - (b.best_score ?? 0);
        default:           return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Evaluation History</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Click any entry to expand score breakdown and response.</p>
      </div>

      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-default)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts…"
            className="bg-transparent text-sm outline-none w-full border-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {TIER_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-mono tracking-wide uppercase transition-colors border"
              style={{
                background: tier === t ? 'var(--accent-light)' : 'var(--bg-subtle)',
                color: tier === t ? 'var(--accent)' : 'var(--text-muted)',
                borderColor: tier === t ? 'var(--accent-border)' : 'var(--border-default)',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border outline-none cursor-pointer font-mono"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Domain filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {DOMAIN_FILTERS.map((d) => {
          const active = domain === d;
          return (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className="text-[10px] font-mono tracking-wide px-3 py-1 rounded-full capitalize uppercase border transition-colors"
              style={{
                background: active ? 'var(--accent)' : 'var(--bg-subtle)',
                color: active ? '#fff' : 'var(--text-tertiary)',
                borderColor: active ? 'var(--accent)' : 'var(--border-default)',
              }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <motion.div className="w-5 h-5 rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--accent-mid)', borderTopColor: 'transparent' }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
          <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading history…</p>
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="p-10 text-center space-y-4">
          <Telescope size={40} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {evaluations.length === 0 ? 'No evaluations yet.' : 'No results match your filters.'}
          </p>
          {evaluations.length === 0 && (
            <Link to="/chat" className="inline-flex items-center gap-1.5 text-xs font-mono hover:underline" style={{ color: 'var(--accent)' }}>
              Run an evaluation on the Chat page →
            </Link>
          )}
        </GlassCard>
      ) : (
        <motion.div variants={stagger(0.04)} initial="hidden" animate="visible" className="space-y-2">
          {filtered.map((ev, i) => <HistoryCard key={ev.id || i} ev={ev} />)}
        </motion.div>
      )}
    </div>
  );
}
