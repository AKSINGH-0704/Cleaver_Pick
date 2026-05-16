import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { statusColor } from '../utils/colors';

function AnimatedCheck({ color }) {
  return (
    <svg viewBox="0 0 20 20" className="w-4 h-4 flex-shrink-0" fill="none">
      <motion.path
        d="M4 10.5l4 4 8-8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </svg>
  );
}

function StatusIcon({ status }) {
  const color = statusColor(status);
  if (status === 'verified') return <AnimatedCheck color={color} />;
  if (status === 'partial')
    return <AlertTriangle size={14} className="flex-shrink-0" style={{ color }} />;
  return <XCircle size={14} className="flex-shrink-0" style={{ color }} />;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden:   { opacity: 0, x: -8 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function SummaryPill({ count, label, color, bg }) {
  if (!count) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full"
      style={{ color, background: bg }}
    >
      {count} {label}
    </span>
  );
}

function ClaimRow({ claim }) {
  const color = statusColor(claim.status);
  const simPct = Math.round((claim.similarity ?? 0) * 100);

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-3 py-2.5 last:border-0"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="mt-0.5">
        <StatusIcon status={claim.status} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm leading-snug" style={{ color: 'var(--text-secondary)' }}>
          {claim.claim}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {claim.source && (
            <a
              href={claim.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              {claim.source} <ExternalLink size={9} />
            </a>
          )}
          {simPct > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Confidence:</span>
              <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-muted)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${simPct}%`, backgroundColor: color }}
                />
              </div>
              <span className="text-[10px] font-mono" style={{ color }}>{simPct}%</span>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border"
        style={{
          color,
          borderColor: color + '40',
          background: color + '12',
        }}
      >
        {simPct}
      </div>
    </motion.div>
  );
}

export default function ClaimsReport({ claims = [], verified = 0, partial = 0, notFound = 0, compact = false }) {
  if (!claims.length) {
    return (
      <p className="text-xs italic py-2" style={{ color: 'var(--text-muted)' }}>
        No verifiable claims extracted from this response.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
          <span className="text-[11px] uppercase tracking-widest font-mono" style={{ color: 'var(--text-muted)' }}>
            Fact Verification Report
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SummaryPill count={verified}  label="Verified ✓"  color="#059669" bg="#ECFDF5" />
          <SummaryPill count={partial}   label="Partial ⚠"   color="#D97706" bg="#FFFBEB" />
          <SummaryPill count={notFound}  label="Not Found ✗" color="#E11D48" bg="#FFF1F2" />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`space-y-0 ${compact ? '' : 'rounded-xl px-3 py-1'}`}
        style={compact ? {} : { background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
      >
        {claims.map((c, i) => (
          <ClaimRow key={i} claim={c} />
        ))}
      </motion.div>
    </div>
  );
}
