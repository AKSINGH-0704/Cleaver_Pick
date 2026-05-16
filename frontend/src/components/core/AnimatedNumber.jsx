import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

// Count-up number. Activates on viewport entry by default. Pass `instant`
// to skip the intersection observer and animate immediately.
export default function AnimatedNumber({
  value,
  decimals = 0,
  duration = 1.2,
  prefix = '',
  suffix = '',
  className = '',
  instant = false,
  style = {},
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!instant && !inView) return;
    const target = Number(value) || 0;
    const start = performance.now();
    const from = 0;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, inView, instant, duration]);

  const factor = Math.pow(10, decimals);
  const rounded = Math.round(display * factor) / factor;

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {rounded.toFixed(decimals)}
      {suffix}
    </span>
  );
}
