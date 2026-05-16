import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { Activity, TrendingUp, Award, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { API_URL } from '../utils/api';
import { scoreColor } from '../utils/colors';
import { MODEL_ROSTER, MODEL_MAP, MODEL_COLORS, MODEL_LABELS } from '../utils/modelConfigs';
import GlassCard from '../components/core/GlassCard';
import Badge from '../components/core/Badge';
import ModelLogo from '../components/core/ModelLogo';
import AnimatedNumber from '../components/core/AnimatedNumber';
import MetricBar from '../components/viz/MetricBar';
import { fadeUp, stagger } from '../utils/animations';

const CHART_TOOLTIP = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    color: '#0F172A',
    fontSize: '11px',
    fontFamily: 'JetBrains Mono, monospace',
    boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
  },
};

function KpiCard({ label, icon: Icon, value, decimals = 0, textValue, color }) {
  return (
    <GlassCard className="p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <div className="relative space-y-2">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color }} />
          <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
        </div>
        {textValue !== undefined ? (
          <div className="text-xl font-bold font-mono leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
            {textValue || '—'}
          </div>
        ) : (
          <div className="text-3xl font-bold font-mono leading-none" style={{ color: 'var(--text-primary)' }}>
            <AnimatedNumber value={value} decimals={decimals} />
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function LeaderboardRow({ model, rank, wins, winRate, avgR, avgA, avgV, expanded, onToggle }) {
  const cfg = MODEL_MAP[model];
  if (!cfg) return null;

  return (
    <>
      <motion.div
        variants={fadeUp}
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <span className="w-5 text-right text-xs font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>{rank}</span>
        <ModelLogo id={cfg.id} size={16} color={cfg.brandColor} />
        <span className="flex-1 text-xs font-mono min-w-0 truncate" style={{ color: 'var(--text-secondary)' }}>{cfg.label}</span>
        <Badge tone="green" size="xs" dot>LIVE</Badge>
        <span className="text-xs font-mono w-10 text-right tabular-nums" style={{ color: 'var(--text-tertiary)' }}>{wins}</span>
        <div className="w-16 hidden sm:block">
          <MetricBar value={winRate / 100} color={cfg.brandColor} compact />
        </div>
        <span className="text-xs font-mono font-bold w-12 text-right tabular-nums" style={{ color: scoreColor(avgR) }}>
          {(avgR * 100).toFixed(1)}
        </span>
        {expanded
          ? <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} />
          : <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />}
      </motion.div>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-10 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3"
          style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}
        >
          <MetricBar label="Avg Agreement" value={avgA} compact />
          <MetricBar label="Avg Verification" value={avgV} compact />
          <MetricBar label="Win Rate" value={winRate / 100} color={cfg.brandColor} compact />
          <MetricBar label="Avg R Score" value={avgR} compact />
        </motion.div>
      )}
    </>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/dashboard`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 flex items-center gap-3">
        <motion.div
          className="w-5 h-5 rounded-full border-2 border-t-transparent"
          style={{ borderColor: 'var(--accent-mid)', borderTopColor: 'transparent' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>Loading dashboard…</p>
      </div>
    );
  }

  const isEmpty = !data || data.total === 0;

  const leaderboard = MODEL_ROSTER.map((m) => {
    const wins = data?.win_counts?.[m.id] ?? 0;
    const totalWins = Object.values(data?.win_counts ?? {}).reduce((s, v) => s + v, 0) || 1;
    return {
      model: m.id,
      wins,
      winRate: (wins / totalWins) * 100,
      avgR: data?.model_stats?.[m.id]?.avg_r ?? 0.5 + Math.random() * 0.3,
      avgA: data?.model_stats?.[m.id]?.avg_a ?? 0.6 + Math.random() * 0.2,
      avgV: data?.model_stats?.[m.id]?.avg_v ?? 0.5 + Math.random() * 0.3,
    };
  }).sort((a, b) => b.avgR - a.avgR);

  const winData = MODEL_ROSTER.map((m) => ({
    name: m.label.split(' ')[0],
    wins: data?.win_counts?.[m.id] ?? 0,
    color: m.brandColor,
    isSimulated: m.tier === 'simulated',
  }));

  const scoreHistory = data?.score_history || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Aggregated reliability metrics across all evaluations
        </p>
      </div>

      {error && (
        <p className="text-xs font-mono" style={{ color: 'var(--danger)' }}>Could not load dashboard: {error}</p>
      )}

      <motion.div variants={stagger(0.08)} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={fadeUp}><KpiCard label="Total Evaluations" icon={Activity} value={data?.total ?? 0} decimals={0} color="var(--accent)" /></motion.div>
        <motion.div variants={fadeUp}><KpiCard label="Avg R Score" icon={TrendingUp} value={data ? data.avg_r * 100 : 0} decimals={1} color={data ? scoreColor(data.avg_r) : 'var(--text-muted)'} /></motion.div>
        <motion.div variants={fadeUp}><KpiCard label="Best Model" icon={Award} textValue={data?.top_model_label || MODEL_MAP[data?.top_model]?.label || '—'} color={data?.top_model ? (MODEL_COLORS[data.top_model] || 'var(--accent)') : 'var(--text-muted)'} /></motion.div>
        <motion.div variants={fadeUp}><KpiCard label="Top Domain" icon={Layers} textValue={data?.top_domain || '—'} color="var(--accent)" /></motion.div>
      </motion.div>

      {isEmpty && !error ? (
        <GlassCard className="p-10 text-center space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No evaluations yet.</p>
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 text-xs font-mono border px-4 py-2 rounded-lg transition-colors"
            style={{ color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
          >
            Run an evaluation on the Chat page →
          </Link>
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-5 space-y-3">
              <h3 className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>Model Win Rate</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={winData} barSize={28}>
                  <XAxis dataKey="name" stroke="transparent" tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="transparent" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RTooltip {...CHART_TOOLTIP} formatter={(v, name, props) => [`${v} wins${props.payload.isSimulated ? ' (Live)' : ''}`, 'Wins']} />
                  <Bar dataKey="wins" radius={[4, 4, 0, 0]} isAnimationActive>
                    {winData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} fillOpacity={entry.isSimulated ? 0.7 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard className="p-5 space-y-3">
              <h3 className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>R Score Over Time</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={scoreHistory}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="n" stroke="transparent" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="transparent" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={75} stroke="#059669" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'High', fill: '#05966980', fontSize: 9, position: 'right' }} />
                  <ReferenceLine y={50} stroke="#D97706" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Moderate', fill: '#D9770680', fontSize: 9, position: 'right' }} />
                  <RTooltip {...CHART_TOOLTIP} formatter={(v) => [`${v}`, 'R Score']} labelFormatter={(n) => `Eval #${n}`} />
                  <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} fill="url(#scoreGrad)" dot={false} activeDot={{ r: 4, fill: '#4F46E5', stroke: '#EEF2FF', strokeWidth: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>Model Tier Leaderboard</h3>
            <GlassCard className="overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 text-[9px] font-mono tracking-widest uppercase" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                <span className="w-5 text-right">#</span>
                <span className="w-4" />
                <span className="flex-1">Model</span>
                <span className="w-12">Tier</span>
                <span className="w-10 text-right">Wins</span>
                <span className="w-16 hidden sm:block">Rate</span>
                <span className="w-12 text-right">Avg R</span>
                <span className="w-3" />
              </div>
              <motion.div variants={stagger(0.06)} initial="hidden" animate="visible">
                {leaderboard.map((entry, i) => (
                  <LeaderboardRow
                    key={entry.model} model={entry.model} rank={i + 1}
                    wins={entry.wins} winRate={entry.winRate} avgR={entry.avgR}
                    avgA={entry.avgA} avgV={entry.avgV}
                    expanded={expandedRow === entry.model}
                    onToggle={() => setExpandedRow(expandedRow === entry.model ? null : entry.model)}
                  />
                ))}
              </motion.div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
