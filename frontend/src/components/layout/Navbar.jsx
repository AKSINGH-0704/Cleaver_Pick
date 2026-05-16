import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageSquare, BarChart2, FlaskConical, Clock, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../../utils/api';

const NAV_ITEMS = [
  { to: '/',          label: 'Home',      icon: Home,          end: true },
  { to: '/chat',      label: 'Arena',     icon: MessageSquare },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/benchmark', label: 'Benchmark', icon: FlaskConical },
  { to: '/history',   label: 'History',   icon: Clock },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Navbar() {
  const [healthy, setHealthy] = useState(null);
  const failCount = useRef(0);
  const location = useLocation();

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) { failCount.current = 0; setHealthy(true); }
      else { failCount.current += 1; if (failCount.current >= 2) setHealthy(false); }
    } catch {
      failCount.current += 1;
      if (failCount.current >= 2) setHealthy(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const id = setInterval(checkHealth, 10_000);
    return () => clearInterval(id);
  }, [checkHealth]);

  const healthColor =
    healthy === null ? 'var(--warning)' : healthy ? 'var(--success)' : 'var(--danger)';
  const healthLabel =
    healthy === null ? 'checking' : healthy ? 'api live' : 'api down';

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(248,250,252,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-sm)' }}
          >
            <span className="font-mono text-[11px] font-bold text-white">CP</span>
          </div>
          <span className="font-sans text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            CleverPick
          </span>
          <span className="hidden sm:inline text-[9px] font-mono uppercase tracking-widest mt-0.5" style={{ color: 'var(--text-muted)' }}>
            OBSERVATORY
          </span>
        </NavLink>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
            const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-2 right-2 bottom-0 h-[2px] rounded-full"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* API status */}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: healthColor }}
          />
          <span className="font-mono hidden sm:inline">{healthLabel}</span>
        </div>
      </div>
    </nav>
  );
}
