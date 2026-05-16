import { useState, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Wand2, Zap, GitMerge, Shield, Scale, Award, ArrowRight,
} from 'lucide-react';
import Badge from '../components/core/Badge';
import GlowButton from '../components/core/GlowButton';
import ModelLogo from '../components/core/ModelLogo';
import GlassCard from '../components/core/GlassCard';
import AnimatedNumber from '../components/core/AnimatedNumber';
import ScoreArcGauge from '../components/viz/ScoreArcGauge';
import Tooltip from '../components/core/Tooltip';
import { MODEL_ROSTER, liveModels, simulatedModels, DOMAINS } from '../utils/modelConfigs';
import { fadeUp, stagger, scaleIn } from '../utils/animations';

function HeroSection() {
  const words = ['Know', 'Which', 'AI', 'to', 'Actually', 'Trust.'];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-12 items-center">
        {/* left text */}
        <motion.div variants={stagger(0.08)} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={fadeUp}>
            <Badge tone="violet" dot pulse size="sm">LLM Reliability Platform</Badge>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold leading-[1.05] tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {words.map((w, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="inline-block mr-[0.3em]"
              >
                {w}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-base sm:text-lg max-w-[540px] leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            CleverPick runs your prompt through 8 competing AI models,
            verifies every claim against Wikipedia, judges each response
            with GPT-4o, and scores a winner — live, in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap gap-3"
          >
            <Link to="/chat">
              <GlowButton variant="primary" size="lg" iconRight={<ArrowRight size={16} />}>
                Enter the Arena
              </GlowButton>
            </Link>
            <Link to="/dashboard">
              <GlowButton variant="secondary" size="lg">View Dashboard</GlowButton>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="flex flex-wrap gap-3 pt-2">
            {MODEL_ROSTER.map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: m.tier === 'simulated' ? 0.7 : 1, scale: 1 }}
                transition={{ delay: 0.9 + i * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
                className="flex flex-col items-center gap-1"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
                >
                  <ModelLogo id={m.id} size={18} color={m.brandColor} />
                </div>
                <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  {m.label.split(' ')[0]}
                </span>
                {m.tier === 'simulated' && (
                  <Badge tone="green" size="xs">LIVE</Badge>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* right: floating demo card */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
            <GlassCard elevated className="p-5 w-[280px] space-y-4">
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                Live Arena Preview
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {MODEL_ROSTER.slice(0, 8).map((m) => (
                  <div key={m.id} className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
                    >
                      <ModelLogo id={m.id} size={12} color={m.brandColor} />
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: m.brandColor }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${60 + Math.random() * 35}%` }}
                        transition={{ delay: 1.5 + Math.random() * 0.5, duration: 1.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <ScoreArcGauge score={0.81} size={120} label="R SCORE" />
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ModelShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="px-4 py-20 max-w-6xl mx-auto space-y-10" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <motion.div initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} className="text-center space-y-2">
        <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
          Competing Models
        </h2>
      </motion.div>

      <div className="space-y-3">
        <Badge tone="green" size="sm" dot pulse>LIVE DATA</Badge>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {liveModels.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.5 }}>
              <GlassCard hover className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ModelLogo id={m.id} size={22} color={m.brandColor} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.label}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{m.provider}</div>
                  </div>
                </div>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>{m.tagline}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Badge tone="green" size="sm" dot>LIVE</Badge>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {simulatedModels.map((m, i) => (
            <Tooltip key={m.id} content="UI-only visual. Based on real model output variation.">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 0.9, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }} className="w-full">
                <GlassCard hover className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ModelLogo id={m.id} size={18} color={m.brandColor} />
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                  </div>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{m.tagline}</p>
                  <Badge tone="green" size="xs">LIVE</Badge>
                </GlassCard>
              </motion.div>
            </Tooltip>
          ))}
        </div>
      </div>
    </section>
  );
}

const PIPELINE_STAGES = [
  { icon: Brain,    label: 'Intent',    desc: 'Classify prompt' },
  { icon: Zap,      label: 'Dispatch',  desc: 'Fire to 8 models' },
  { icon: GitMerge, label: 'Agreement', desc: 'Cross-model similarity' },
  { icon: Shield,   label: 'Verify',    desc: 'Wikipedia fact-check' },
  { icon: Scale,    label: 'Judge',     desc: 'GPT-4o scoring' },
  { icon: Award,    label: 'R Score',   desc: 'Composite winner' },
];

function PipelineSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section ref={ref} className="px-4 py-20 max-w-5xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
          How It Works
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>6-stage reliability pipeline</p>
      </div>

      <div className="relative flex flex-wrap justify-center gap-4 md:gap-0">
        {PIPELINE_STAGES.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.12, type: 'spring', stiffness: 250, damping: 20 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent-light)', border: '2px solid var(--accent-border)' }}
                >
                  <Icon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{s.desc}</span>
              </motion.div>
              {i < PIPELINE_STAGES.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={inView ? { scaleX: 1 } : {}}
                  transition={{ delay: i * 0.12 + 0.1, duration: 0.4 }}
                  className="hidden md:block w-8 lg:w-12 h-[2px] mx-2 mt-[-20px]"
                  style={{ background: 'var(--border-default)', originX: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.8 }}>
        <GlassCard className="p-5 max-w-xl mx-auto text-center">
          <div className="font-mono text-sm space-x-1">
            <span style={{ color: 'var(--text-tertiary)' }}>R =</span>
            <span style={{ color: 'var(--accent)' }}>0.35</span><span style={{ color: 'var(--text-tertiary)' }}>·A +</span>
            <span style={{ color: 'var(--success)' }}>0.30</span><span style={{ color: 'var(--text-tertiary)' }}>·V +</span>
            <span style={{ color: 'var(--warning)' }}>0.25</span><span style={{ color: 'var(--text-tertiary)' }}>·E +</span>
            <span style={{ color: '#2563EB' }}>0.10</span><span style={{ color: 'var(--text-tertiary)' }}>·C</span>
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
            Agreement · Verification · Evaluation · Consistency
          </p>
        </GlassCard>
      </motion.div>
    </section>
  );
}

function LiveDemoSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [vals, setVals] = useState({ A: 0.82, V: 0.75, E: 0.80, C: 0.88 });
  const [demoWeights, setDemoWeights] = useState({ A: 0.35, V: 0.30, E: 0.25, C: 0.10 });

  const score = useMemo(
    () => vals.A * demoWeights.A + vals.V * demoWeights.V + vals.E * demoWeights.E + vals.C * demoWeights.C,
    [vals, demoWeights],
  );

  const COMPONENTS = [
    { key: 'A', label: 'Agreement',    color: '#4F46E5' },
    { key: 'V', label: 'Verification', color: '#059669' },
    { key: 'E', label: 'Evaluation',   color: '#D97706' },
    { key: 'C', label: 'Consistency',  color: '#2563EB' },
  ];

  return (
    <section ref={ref} className="px-4 py-20 max-w-4xl mx-auto space-y-8" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="text-center space-y-2">
        <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase" style={{ color: 'var(--accent)' }}>
          Interactive Demo
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Drag the sliders to see how the R Score changes</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2, duration: 0.6 }}>
        <GlassCard elevated className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-8 items-center">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-1.5 mb-4">
                {DOMAINS.slice(0, 5).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDemoWeights({ ...d.weights })}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wide uppercase border transition-colors"
                    style={{ background: 'var(--bg-subtle)', color: 'var(--text-tertiary)', borderColor: 'var(--border-default)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {COMPONENTS.map(({ key, label, color }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono" style={{ color }}>{label} ({key})</span>
                    <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {(vals[key] * 100).toFixed(0)}
                    </span>
                  </div>
                  <input
                    type="range" min={0} max={1} step={0.01}
                    value={vals[key]}
                    onChange={(e) => setVals((p) => ({ ...p, [key]: +e.target.value }))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center">
              <ScoreArcGauge score={score} size={200} label="R SCORE" />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  );
}

function CTABanner() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <section ref={ref} className="px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto rounded-2xl p-10 text-center space-y-5"
        style={{ background: 'var(--text-primary)', border: '1px solid var(--text-primary)' }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text-on-dark)' }}>
          8 models. 6 stages. 1 truth.
        </h2>
        <p className="max-w-md mx-auto" style={{ color: 'rgba(248,250,252,0.65)' }}>
          Stop guessing which AI is right. Let them compete and let the evidence decide.
        </p>
        <Link to="/chat">
          <GlowButton variant="primary" size="lg" iconRight={<ArrowRight size={16} />}
            style={{ background: '#F59E0B', color: 'var(--text-primary)', border: 'none' }}
          >
            Start Evaluating
          </GlowButton>
        </Link>
      </motion.div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-page)' }}>
      <HeroSection />
      <ModelShowcase />
      <PipelineSection />
      <LiveDemoSection />
      <CTABanner />
    </div>
  );
}
