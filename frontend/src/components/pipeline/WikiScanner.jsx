import { motion } from 'framer-motion';
import { Check, AlertTriangle, X } from 'lucide-react';
import GlassCard from '../core/GlassCard';
import Badge from '../core/Badge';

const STATUS_CONFIG = {
  verified:  { icon: Check,         color: '#059669', tone: 'green', label: 'Verified' },
  partial:   { icon: AlertTriangle, color: '#D97706', tone: 'amber', label: 'Partial' },
  not_found: { icon: X,             color: '#E11D48', tone: 'rose',  label: 'Not Found' },
};

const DEFAULT_CLAIMS = [
  { text: 'Aspirin inhibits cyclooxygenase enzymes COX-1 and COX-2', status: 'verified', source: 'Aspirin — Wikipedia', similarity: 0.94 },
  { text: 'Daily low-dose aspirin reduces heart attack risk by 30%', status: 'partial', source: 'Cardiovascular disease prevention', similarity: 0.71 },
  { text: 'Common side effects include gastrointestinal bleeding', status: 'verified', source: 'Aspirin — Side effects', similarity: 0.88 },
  { text: 'Aspirin was first synthesized in 1897 by Felix Hoffmann', status: 'verified', source: 'History of aspirin — Wikipedia', similarity: 0.96 },
  { text: 'Reye syndrome risk in children under 16', status: 'partial', source: "Reye's syndrome — Wikipedia", similarity: 0.67 },
];

function ClaimBlock({ claim, index }) {
  const { icon: Icon, color, tone, label } = STATUS_CONFIG[claim.status] || STATUS_CONFIG.not_found;
  const scanDelay = index * 0.8;
  const connectDelay = scanDelay + 0.9;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-3 items-start">
      {/* Left: claim with scan overlay */}
      <div
        className="relative overflow-hidden rounded-lg p-3"
        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}
      >
        <p className="text-xs font-mono leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          {claim.text}
        </p>
        {/* scanning sweep line */}
        <motion.div
          className="absolute left-0 w-full h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.6 }}
          initial={{ top: '0%', opacity: 0 }}
          animate={{ top: ['0%', '100%'], opacity: [0, 0.6, 0.6, 0] }}
          transition={{ duration: 0.9, delay: scanDelay, ease: 'easeInOut' }}
        />
      </div>

      {/* Center: connector line (desktop) */}
      <motion.div
        className="hidden md:flex items-center"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: connectDelay, duration: 0.4 }}
        style={{ originX: 0 }}
      >
        <div className="w-10 h-[1px] rounded-full" style={{ backgroundColor: 'var(--border-default)' }} />
      </motion.div>

      {/* Right: Wikipedia source */}
      <motion.div
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: connectDelay + 0.2, duration: 0.35 }}
        className="flex items-start gap-2 rounded-lg p-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
      >
        <Icon size={14} style={{ color, flexShrink: 0, marginTop: 2 }} />
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-mono truncate" style={{ color: 'var(--text-tertiary)' }}>{claim.source}</p>
          <div className="flex items-center gap-2">
            <Badge tone={tone} size="xs">{label}</Badge>
            <span className="text-[10px] font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {(claim.similarity * 100).toFixed(0)}% match
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function WikiScanner({ data = {} }) {
  const claims = data.claims || DEFAULT_CLAIMS;

  return (
    <GlassCard className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
            Claims Extracted & Verified
          </h3>
          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            Wikipedia source matching with semantic similarity
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="green" size="xs">{claims.filter((c) => c.status === 'verified').length} Verified</Badge>
          <Badge tone="amber" size="xs">{claims.filter((c) => c.status === 'partial').length} Partial</Badge>
          <Badge tone="rose" size="xs">{claims.filter((c) => c.status === 'not_found').length} Not Found</Badge>
        </div>
      </div>

      <div className="space-y-3">
        {claims.map((claim, i) => (
          <ClaimBlock key={i} claim={claim} index={i} />
        ))}
      </div>
    </GlassCard>
  );
}
