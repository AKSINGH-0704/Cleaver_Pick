import { NavLink } from 'react-router-dom';
import { MessageSquare, BarChart2, FlaskConical, Clock, Settings } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../utils/api';

const navItems = [
  { to: '/',          label: 'Chat',      icon: MessageSquare },
  { to: '/dashboard', label: 'Dashboard', icon: BarChart2 },
  { to: '/benchmark', label: 'Benchmark', icon: FlaskConical },
  { to: '/history',   label: 'History',   icon: Clock },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

export default function Navbar() {
  const [healthy, setHealthy] = useState(null);
  const failCount = useRef(0);

  const checkHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_URL}/api/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        failCount.current = 0;
        setHealthy(true);
      } else {
        failCount.current += 1;
        if (failCount.current >= 2) setHealthy(false);
      }
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

  return (
    <nav className="sticky top-0 z-40 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(11,14,20,0.85)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-space text-base font-bold text-[#06D6A0] tracking-tight">CleverPick</span>
          <span className="text-[9px] text-[#475569] font-mono uppercase tracking-widest mt-0.5">EVAL</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[rgba(6,214,160,0.1)] text-[#06D6A0]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[rgba(255,255,255,0.04)]'
                }`
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* API health indicator */}
        <div className="flex items-center gap-2 text-[11px] text-[#475569]">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              healthy === null
                ? 'bg-[#475569]'
                : healthy
                ? 'bg-[#06D6A0] status-dot-pulse shadow-[0_0_6px_rgba(6,214,160,0.6)]'
                : 'bg-[#EF476F]'
            }`}
          />
          <span className="font-mono">
            {healthy === null ? 'checking' : healthy ? 'api live' : 'api down'}
          </span>
        </div>
      </div>
    </nav>
  );
}
