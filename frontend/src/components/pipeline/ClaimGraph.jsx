import { motion } from 'framer-motion';
import GlassCard from '../core/GlassCard';

const STATUS_EDGE = {
  verified:  { stroke: '#059669', width: 2.5, dash: 'none' },
  partial:   { stroke: '#D97706', width: 2,   dash: '6 4' },
  not_found: { stroke: '#E11D48', width: 1.5, dash: '3 3' },
};

const DEFAULT_CLAIMS = [
  { text: 'Aspirin inhibits COX-1 and COX-2',        status: 'verified',  source: 'Aspirin — Wikipedia' },
  { text: 'Reduces heart attack risk by 30%',          status: 'partial',   source: 'Cardiovascular prevention' },
  { text: 'GI bleeding is a common side effect',       status: 'verified',  source: 'Aspirin side effects' },
  { text: 'Synthesized in 1897 by Hoffmann',           status: 'verified',  source: 'History of aspirin' },
  { text: "Reye's syndrome risk in children",          status: 'not_found', source: null },
];

function truncate(str, len = 28) {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

export default function ClaimGraph({ data = {} }) {
  const claims = data.claims || DEFAULT_CLAIMS;

  const svgW = 600;
  const svgH = Math.max(claims.length * 64 + 40, 260);
  const claimX  = 140;
  const sourceX = 460;

  const positions = claims.map((_, i) => {
    const y = 40 + i * 60;
    return { claimPos: { x: claimX, y }, sourcePos: { x: sourceX, y } };
  });

  return (
    <GlassCard className="p-5 space-y-3">
      <div className="space-y-1">
        <h3 className="text-xs font-mono tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
          Knowledge Graph
        </h3>
        <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Claim → Source verification mapping
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full max-w-[600px] mx-auto"
          style={{ minWidth: 400 }}
        >
          {/* Edges */}
          {claims.map((claim, i) => {
            const { claimPos, sourcePos } = positions[i];
            const edge = STATUS_EDGE[claim.status] || STATUS_EDGE.not_found;
            const hasSource = claim.source && claim.status !== 'not_found';

            return (
              <motion.path
                key={`edge-${i}`}
                d={`M ${claimX + 60} ${claimPos.y} C ${claimX + 120} ${claimPos.y}, ${sourceX - 120} ${sourcePos.y}, ${sourceX - 50} ${sourcePos.y}`}
                fill="none"
                stroke={edge.stroke}
                strokeWidth={edge.width}
                strokeDasharray={edge.dash === 'none' ? undefined : edge.dash}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: hasSource ? 1 : 0.6, opacity: 1 }}
                transition={{ delay: i * 0.2 + 0.3, duration: 0.6, ease: 'easeOut' }}
              />
            );
          })}

          {/* Claim nodes (left) */}
          {claims.map((claim, i) => {
            const { claimPos } = positions[i];
            return (
              <motion.g
                key={`claim-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, duration: 0.4 }}
              >
                <rect
                  x={claimPos.x - 60}
                  y={claimPos.y - 14}
                  width={120}
                  height={28}
                  rx={6}
                  fill="#EEF2FF"
                  stroke="#C7D2FE"
                  strokeWidth={1}
                />
                <text
                  x={claimPos.x}
                  y={claimPos.y + 4}
                  textAnchor="middle"
                  fill="#4F46E5"
                  style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {truncate(claim.text, 22)}
                </text>
              </motion.g>
            );
          })}

          {/* Source nodes (right) */}
          {claims.map((claim, i) => {
            const { sourcePos } = positions[i];
            const hasSource = claim.source && claim.status !== 'not_found';
            return (
              <motion.g
                key={`source-${i}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 + 0.6, type: 'spring', stiffness: 200, damping: 18 }}
              >
                {hasSource ? (
                  <>
                    <circle
                      cx={sourcePos.x}
                      cy={sourcePos.y}
                      r={20}
                      fill="#ECFDF5"
                      stroke="#A7F3D0"
                      strokeWidth={1}
                    />
                    <text
                      x={sourcePos.x}
                      y={sourcePos.y + 3}
                      textAnchor="middle"
                      fill="#059669"
                      style={{ fontSize: 7, fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {truncate(claim.source, 18)}
                    </text>
                  </>
                ) : (
                  <>
                    <circle
                      cx={sourcePos.x}
                      cy={sourcePos.y}
                      r={16}
                      fill="#FFF1F2"
                      stroke="#FECDD3"
                      strokeWidth={1}
                    />
                    <text
                      x={sourcePos.x}
                      y={sourcePos.y + 4}
                      textAnchor="middle"
                      style={{ fontSize: 14, fill: '#E11D48' }}
                    >
                      ✗
                    </text>
                  </>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* legend */}
      <div className="flex items-center gap-4 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <span className="w-6 h-[2px] rounded-full" style={{ background: '#059669' }} /> Verified
        </span>
        <span className="flex items-center gap-1">
          <span className="w-6 h-[2px] rounded-full" style={{ background: '#D97706' }} /> Partial
        </span>
        <span className="flex items-center gap-1">
          <span className="w-6 h-[1.5px] rounded-full" style={{ background: '#E11D48' }} /> Not found
        </span>
      </div>
    </GlassCard>
  );
}
