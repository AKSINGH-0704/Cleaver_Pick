import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { statusColor } from '../utils/colors';

// ── Animated SVG check (verified claims) ─────────────────────────────────
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

// ── Status icon per claim ─────────────────────────────────────────────────
function StatusIcon({ status }) {
  const color = statusColor(status);
  if (status === 'verified') return <AnimatedCheck color={color} />;
  if (status === 'partial')
    return <AlertTriangle size={14} className="flex-shrink-0" style={{ color }} />;
  return <XCircle size={14} className="flex-shrink-0" style={{ color }} />;
}

// ── Stagger variants ──────────────────────────────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden:   { opacity: 0, x: -8 },
  visible:  { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Summary pill ──────────────────────────────────────────────────────────
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

// ── Single claim row ──────────────────────────────────────────────────────
function ClaimRow({ claim }) {
  const color = statusColor(claim.status);
  const sim   = claim.similarity ?? 0;
  const simPct = Math.round(sim * 100);

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-3 py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-0"
    >
      {/* Status icon */}
      <div className="mt-0.5">
        <StatusIcon status={claim.status} />
      </div>

      {/* Claim text + source */}
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm text-[#F1F5F9] leading-snug" style={{ fontFamily: 'DM Sans, sans-serif' }}>
          {claim.claim}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {claim.source && (
            <a
              href={claim.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#475569] hover:text-[#06D6A0] transition-colors"
            >
              {claim.source} <ExternalLink size={9} />
            </a>
          )}
          {simPct > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#475569]">Confidence:</span>
              <div className="w-16 h-1 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
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

      {/* Circular similarity badge */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border"
        style={{
          color,
          borderColor: color + '40',
          background: color + '12',
          fontFamily: 'Space Mono, monospace',
        }}
      >
        {simPct}
      </div>
    </motion.div>
  );
}

// ── Public component ──────────────────────────────────────────────────────
export default function ClaimsReport({ claims = [], verified = 0, partial = 0, notFound = 0, compact = false }) {
  if (!claims.length) {
    return (
      <p className="text-xs text-[#475569] italic py-2">
        No verifiable claims extracted from this response.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#06D6A0]" />
          <span
            className="text-[11px] text-[#94A3B8] uppercase tracking-widest"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            Fact Verification Report
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SummaryPill count={verified}  label="Verified ✓"    color="#06D6A0" bg="rgba(6,214,160,0.10)"  />
          <SummaryPill count={partial}   label="Partial ⚠"     color="#FFB627" bg="rgba(255,182,39,0.10)" />
          <SummaryPill count={notFound}  label="Not Found ✗"   color="#EF476F" bg="rgba(239,71,111,0.10)" />
        </div>
      </div>

      {/* Claim rows */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`space-y-0 ${compact ? '' : 'bg-[rgba(255,255,255,0.02)] rounded-xl px-3 py-1 border border-[rgba(255,255,255,0.04)]'}`}
      >
        {claims.map((c, i) => (
          <ClaimRow key={i} claim={c} />
        ))}
      </motion.div>
    </div>
  );
}
