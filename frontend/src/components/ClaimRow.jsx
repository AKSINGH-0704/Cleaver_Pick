import { CheckCircle, AlertCircle, HelpCircle, ExternalLink } from 'lucide-react';
import { statusColor } from '../utils/colors';

const icons = {
  verified:  <CheckCircle size={13} />,
  partial:   <AlertCircle size={13} />,
  not_found: <HelpCircle size={13} />,
};

export default function ClaimRow({ claim }) {
  const color = statusColor(claim.status);
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
      <span style={{ color }} className="mt-0.5 flex-shrink-0">
        {icons[claim.status] || icons.not_found}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[#F1F5F9] leading-relaxed">{claim.claim}</p>
        {claim.source && (
          <a
            href={claim.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#475569] hover:text-[#06D6A0] mt-0.5 transition-colors"
          >
            {claim.source} <ExternalLink size={9} />
          </a>
        )}
      </div>
      <span className="text-[10px] font-mono flex-shrink-0 mt-0.5" style={{ color }}>
        {(claim.similarity * 100).toFixed(0)}%
      </span>
    </div>
  );
}
