export default function AppShell({ children, className = '' }) {
  return (
    <div
      className={`relative min-h-[calc(100vh-56px)] ${className}`}
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Subtle dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.5,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
