const TONE_STYLES = {
  cyan:   { bg: '#EEF2FF', fg: '#4F46E5', bd: '#C7D2FE' },
  amber:  { bg: '#FFFBEB', fg: '#D97706', bd: '#FDE68A' },
  rose:   { bg: '#FFF1F2', fg: '#E11D48', bd: '#FECDD3' },
  violet: { bg: '#EEF2FF', fg: '#4F46E5', bd: '#C7D2FE' },
  blue:   { bg: '#EFF6FF', fg: '#2563EB', bd: '#BFDBFE' },
  muted:  { bg: '#F1F5F9', fg: '#64748B', bd: '#E2E8F0' },
  green:  { bg: '#ECFDF5', fg: '#059669', bd: '#A7F3D0' },
};

export default function Badge({
  tone = 'muted',
  children,
  icon = null,
  dot = false,
  pulse = false,
  size = 'sm',
  className = '',
  style = {},
}) {
  const t = TONE_STYLES[tone] || TONE_STYLES.muted;
  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5',
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono tracking-widest uppercase rounded-full border ${sizeClasses} ${className}`}
      style={{ background: t.bg, color: t.fg, borderColor: t.bd, ...style }}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${pulse ? 'status-dot-pulse' : ''}`}
          style={{ background: t.fg }}
        />
      )}
      {icon}
      {children}
    </span>
  );
}
