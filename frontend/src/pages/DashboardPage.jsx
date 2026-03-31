import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart2, Zap, Award, Globe } from 'lucide-react';
import { API_URL } from '../utils/api';
import { MODEL_COLORS, MODEL_LABELS, scoreColor } from '../utils/colors';
import StatCard from '../components/StatCard';
import DomainLeaderboard from '../components/DomainLeaderboard';

const tooltipStyle = {
  contentStyle: {
    background: '#0B0E14',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    color: '#F1F5F9',
    fontSize: '12px',
  },
};

function relativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Re-fetch every time the component mounts (navigating back triggers this)
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/dashboard`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-3">
        <div className="w-4 h-4 rounded-full border-2 border-[#06D6A0] border-t-transparent animate-spin" />
        <p className="text-[#475569] text-sm">Loading dashboard...</p>
      </div>
    );
  }

  const isEmpty = !data || data.total === 0;

  // Model wins bar chart data
  const winData = Object.entries(data?.win_counts ?? {}).map(([model, wins]) => ({
    name:  MODEL_LABELS[model] || model,
    wins,
    color: MODEL_COLORS[model] || '#7B61FF',
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F1F5F9]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          Dashboard
        </h1>
        <p className="text-sm text-[#475569] mt-1">
          Aggregated reliability metrics across all evaluations
        </p>
      </div>

      {error && <p className="text-xs text-[#EF476F]">Could not load dashboard: {error}</p>}

      {/* 4 Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Evaluations" value={data?.total ?? 0} decimals={0}
          accentColor="#06D6A0" icon={BarChart2} />
        <StatCard label="Avg R Score" value={data ? data.avg_r * 100 : 0} decimals={1}
          accentColor={data ? scoreColor(data.avg_r) : '#475569'} icon={Zap} />
        <StatCard label="Most Reliable" textValue={data?.top_model_label || '—'}
          accentColor={data?.top_model ? (MODEL_COLORS[data.top_model] || '#7B61FF') : '#475569'} icon={Award} />
        <StatCard label="Top Domain" textValue={data?.top_domain || '—'}
          accentColor="#7B61FF" icon={Globe} />
      </div>

      {isEmpty && !error ? (
        <div className="glass-card p-10 text-center space-y-4">
          <p className="text-[#475569] text-sm">No evaluations yet.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#06D6A0] border border-[rgba(6,214,160,0.3)] px-4 py-2 rounded-lg hover:bg-[rgba(6,214,160,0.06)] transition-colors"
          >
            Run an evaluation on the Chat page →
          </Link>
        </div>
      ) : (
        <>
          {/* Model wins bar chart */}
          {winData.length > 0 && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-[10px] text-[#475569] uppercase tracking-widest" style={{ fontFamily: 'Space Mono, monospace' }}>
                Model Win Counts
              </h2>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={winData} barSize={48}>
                  <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false} tickLine={false} />
                  <YAxis stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={v => [`${v} wins`, 'Wins']} />
                  <Bar dataKey="wins" radius={[4, 4, 0, 0]}>
                    {winData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Score over time */}
          {data?.score_history?.length > 1 && (
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-[10px] text-[#475569] uppercase tracking-widest" style={{ fontFamily: 'Space Mono, monospace' }}>
                R Score · Over Time
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.score_history}>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="n" stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#475569" tick={{ fill: '#94A3B8', fontSize: 11 }}
                    axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={v => [`${v}`, 'R Score']} labelFormatter={n => `Eval #${n}`} />
                  <Line type="monotone" dataKey="score" stroke="#06D6A0" strokeWidth={2}
                    dot={false} activeDot={{ r: 4, fill: '#06D6A0' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Domain leaderboard */}
          <div className="space-y-3">
            <h2 className="text-[10px] text-[#475569] uppercase tracking-widest" style={{ fontFamily: 'Space Mono, monospace' }}>
              Domain Leaderboard
            </h2>
            <DomainLeaderboard leaderboard={data?.leaderboard ?? []} />
          </div>

          {/* Recent evaluations */}
          {data?.recent_evaluations?.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-[10px] text-[#475569] uppercase tracking-widest" style={{ fontFamily: 'Space Mono, monospace' }}>
                Recent Evaluations
              </h2>
              <div className="glass-card overflow-hidden">
                {data.recent_evaluations.map((ev, i) => {
                  const modelColor = MODEL_COLORS[ev.best_model] || '#7B61FF';
                  const rColor     = scoreColor(ev.best_score || 0);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-5 py-3.5 border-b border-[rgba(255,255,255,0.03)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    >
                      {/* Prompt */}
                      <p className="flex-1 text-xs text-[#94A3B8] truncate min-w-0">
                        {ev.prompt || '—'}
                      </p>
                      {/* Domain */}
                      {ev.domain && (
                        <span className="text-[10px] font-mono text-[#475569] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-full flex-shrink-0">
                          {ev.domain}
                        </span>
                      )}
                      {/* Model */}
                      <span className="text-[11px] font-mono flex-shrink-0" style={{ color: modelColor }}>
                        {MODEL_LABELS[ev.best_model] || ev.best_model || '—'}
                      </span>
                      {/* Score */}
                      <span className="text-sm font-mono font-bold flex-shrink-0 w-12 text-right" style={{ color: rColor }}>
                        {ev.best_score != null ? (ev.best_score * 100).toFixed(1) : '—'}
                      </span>
                      {/* Time */}
                      <span className="text-[10px] text-[#475569] font-mono flex-shrink-0 w-20 text-right">
                        {relativeTime(ev.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
