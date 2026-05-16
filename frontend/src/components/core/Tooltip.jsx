import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({
  content,
  children,
  side = 'top', // 'top' | 'bottom' | 'left' | 'right'
  className = '',
  delay = 150,
}) {
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const open = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(true), delay);
  };
  const close = () => {
    clearTimeout(timer.current);
    setShow(false);
  };

  const positionCls = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {children}
      <AnimatePresence>
        {show && content && (
          <motion.span
            initial={{ opacity: 0, y: side === 'top' ? 4 : -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-[rgba(255,255,255,0.12)] bg-[#0B0E14] px-2.5 py-1.5 text-[11px] text-[#CBD5E1] shadow-lg ${positionCls}`}
            style={{ backdropFilter: 'blur(8px)' }}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
