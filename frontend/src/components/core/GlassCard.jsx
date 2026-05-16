import { motion } from 'framer-motion';
import { forwardRef } from 'react';

const GlassCard = forwardRef(function GlassCard(
  { children, elevated = false, hover = false, className = '', as: Component = 'div', ...rest },
  ref,
) {
  const base = 'relative rounded-xl border';
  const cls = [base, className].filter(Boolean).join(' ');

  const baseStyle = {
    background: 'var(--bg-card)',
    borderColor: 'var(--border-default)',
    boxShadow: 'var(--shadow-card)',
  };

  if (hover) {
    return (
      <motion.div
        ref={ref}
        className={cls}
        style={baseStyle}
        whileHover={{ y: -2, boxShadow: 'var(--shadow-card-hover)', borderColor: 'var(--border-strong)' }}
        transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  if (Component === motion.div || rest.layout || rest.layoutId) {
    return (
      <motion.div ref={ref} className={cls} style={baseStyle} {...rest}>
        {children}
      </motion.div>
    );
  }
  return (
    <Component ref={ref} className={cls} style={baseStyle} {...rest}>
      {children}
    </Component>
  );
});

export default GlassCard;
