import { motion } from 'framer-motion';

export default function GlowButton({
  variant = 'primary',
  size = 'md',
  children,
  icon = null,
  iconRight = null,
  className = '',
  as: Component = motion.button,
  ...rest
}) {
  const sizeCls = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }[size];

  const variantStyle = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-sm)',
    },
    secondary: {
      background: 'transparent',
      color: 'var(--text-primary)',
      border: '1.5px solid var(--border-strong)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-tertiary)',
      border: '1px solid transparent',
    },
    cyan: {
      background: 'var(--accent)',
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-sm)',
    },
    danger: {
      background: 'var(--danger)',
      color: '#fff',
      border: '1px solid transparent',
      boxShadow: 'var(--shadow-sm)',
    },
  }[variant] || {};

  const hoverStyle = {
    primary:   { background: 'var(--accent-hover)', boxShadow: 'var(--shadow-md)' },
    secondary: { borderColor: 'var(--accent)', background: 'var(--accent-light)', color: 'var(--accent)' },
    ghost:     { background: 'var(--bg-subtle)', color: 'var(--text-primary)' },
    cyan:      { background: 'var(--accent-hover)', boxShadow: 'var(--shadow-md)' },
    danger:    { background: '#BE123C', boxShadow: 'var(--shadow-md)' },
  }[variant] || {};

  return (
    <Component
      whileHover={{ scale: 1.02, ...hoverStyle }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={variantStyle}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 ${sizeCls} ${className}`}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </Component>
  );
}
