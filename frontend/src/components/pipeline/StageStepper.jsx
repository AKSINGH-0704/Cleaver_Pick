import { motion } from 'framer-motion';
import { Brain, Wand2, Zap, GitMerge, Shield, Scale, RefreshCw, Award, Check } from 'lucide-react';
import { useTypewriter } from '../../hooks/useTypewriter';

const STAGES = [
  { key: 'intent',      label: 'Intent',      Icon: Brain },
  { key: 'optimize',    label: 'Optimize',     Icon: Wand2 },
  { key: 'dispatch',    label: 'Dispatch',     Icon: Zap },
  { key: 'agreement',   label: 'Agreement',    Icon: GitMerge },
  { key: 'verify',      label: 'Verify',       Icon: Shield },
  { key: 'judge',       label: 'Judge',        Icon: Scale },
  { key: 'consistency', label: 'Consistency',  Icon: RefreshCw },
  { key: 'rscore',      label: 'R Score',      Icon: Award },
];

export { STAGES };

function nodeState(index, activeStage) {
  if (index < activeStage) return 'complete';
  if (index === activeStage) return 'active';
  return 'pending';
}

function StageNode({ stage, index, state }) {
  const { Icon, label } = stage;

  const nodeStyle = {
    complete: { borderColor: 'var(--success)',     background: 'var(--success-light)', boxShadow: 'none' },
    active:   { borderColor: 'var(--accent)',       background: 'var(--accent-light)',  boxShadow: 'none' },
    pending:  { borderColor: 'var(--border-default)', background: 'var(--bg-subtle)', boxShadow: 'none' },
  }[state];

  const iconColor = {
    complete: 'var(--success)',
    active:   'var(--accent)',
    pending:  'var(--text-muted)',
  }[state];

  const labelColor = {
    complete: 'var(--success)',
    active:   'var(--accent)',
    pending:  'var(--text-muted)',
  }[state];

  return (
    <div className="relative flex flex-col items-center gap-1.5 z-10 select-none">
      <motion.div
        className="relative flex items-center justify-center w-9 h-9 rounded-full border-2"
        animate={nodeStyle}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      >
        {state === 'complete' ? (
          <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
            <Check size={16} style={{ color: 'var(--success)' }} />
          </motion.div>
        ) : (
          <motion.div
            animate={state === 'active' ? { scale: [1, 1.1, 1] } : {}}
            transition={state === 'active' ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
          >
            <Icon size={16} style={{ color: iconColor }} />
          </motion.div>
        )}

        {/* active spinning arc */}
        {state === 'active' && (
          <motion.svg
            className="absolute inset-[-5px]"
            viewBox="0 0 46 46"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          >
            <circle cx="23" cy="23" r="21" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="25 107" strokeLinecap="round" opacity="0.5" />
          </motion.svg>
        )}
      </motion.div>

      <motion.span
        animate={{ color: labelColor }}
        transition={{ duration: 0.3 }}
        className="hidden md:block text-[10px] font-mono tracking-wide uppercase"
      >
        {label}
      </motion.span>
    </div>
  );
}

function Connector({ state }) {
  return (
    <div className="flex-1 h-[2px] relative self-start mt-[18px] min-w-[12px]">
      <div className="absolute inset-0 rounded-full" style={{ background: 'var(--border-default)' }} />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: 'var(--success)' }}
        initial={{ width: '0%' }}
        animate={{ width: state === 'complete' ? '100%' : state === 'active' ? '50%' : '0%' }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

export default function StageStepper({ activeStage = 0, statusMessage = '' }) {
  const typed = useTypewriter(statusMessage, 25, true);
  const progress = Math.min((activeStage / STAGES.length) * 100, 100);

  return (
    <div className="w-full space-y-3">
      {/* Desktop: horizontal */}
      <div className="hidden sm:flex items-start gap-0">
        {STAGES.map((stage, i) => {
          const state = nodeState(i, activeStage);
          return (
            <div key={stage.key} className="contents">
              <StageNode stage={stage} index={i} state={state} />
              {i < STAGES.length - 1 && (
                <Connector state={i < activeStage ? 'complete' : i === activeStage ? 'active' : 'pending'} />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical pill list */}
      <div className="flex sm:hidden flex-col gap-1.5">
        {STAGES.map((stage, i) => {
          const state = nodeState(i, activeStage);
          return (
            <motion.div
              key={stage.key}
              layout
              animate={{
                background: state === 'active' ? 'var(--accent-light)' : state === 'complete' ? 'var(--success-light)' : 'var(--bg-subtle)',
                borderColor: state === 'active' ? 'var(--accent-border)' : state === 'complete' ? 'var(--success-border)' : 'var(--border-default)',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
            >
              <div className="relative flex items-center justify-center w-6 h-6">
                {state === 'complete' ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}>
                    <Check size={14} style={{ color: 'var(--success)' }} />
                  </motion.div>
                ) : (
                  <stage.Icon size={14} style={{ color: state === 'active' ? 'var(--accent)' : 'var(--text-muted)' }} />
                )}
              </div>
              <span
                className="text-xs font-mono uppercase tracking-wide"
                style={{ color: state === 'complete' ? 'var(--success)' : state === 'active' ? 'var(--accent)' : 'var(--text-muted)' }}
              >
                {stage.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Status message */}
      {statusMessage && (
        <p className="text-xs font-mono h-5 truncate" style={{ color: 'var(--text-tertiary)' }}>
          {typed}
        </p>
      )}
    </div>
  );
}
