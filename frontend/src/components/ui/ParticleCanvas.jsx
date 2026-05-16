import { useEffect, useRef } from 'react';

/**
 * Multi-layer particle field with depth, ambient glows, and proximity connections.
 *
 * 3 depth layers:
 *   - Far:  tiny, slow, low opacity (star dust)
 *   - Mid:  medium, normal speed (core particles)
 *   - Near: larger, faster, higher opacity (foreground sparkle)
 *
 * Ambient glow orbs drift slowly across the canvas for "living" background feel.
 * Connection lines drawn between nearby mid+near particles.
 */
export default function ParticleCanvas({ count = 45, className = '' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking for proximity glow
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Layer configs: [speedMult, sizeRange, opacityRange, count%]
    const LAYERS = [
      { speed: 0.12, rMin: 0.5, rMax: 1.2, opMin: 0.15, opMax: 0.3, pct: 0.35 },  // far
      { speed: 0.28, rMin: 1.0, rMax: 2.2, opMin: 0.25, opMax: 0.5, pct: 0.40 },  // mid
      { speed: 0.45, rMin: 1.5, rMax: 3.0, opMin: 0.35, opMax: 0.7, pct: 0.25 },  // near
    ];

    const COLORS = [
      [123, 97, 255],   // violet
      [6, 214, 160],    // cyan
      [17, 138, 178],   // blue
    ];

    const particles = [];
    LAYERS.forEach((layer, li) => {
      const n = Math.round(count * layer.pct);
      for (let i = 0; i < n; i++) {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const op = layer.opMin + Math.random() * (layer.opMax - layer.opMin);
        particles.push({
          x: Math.random() * (w || 1200),
          y: Math.random() * (h || 800),
          vx: (Math.random() - 0.5) * layer.speed * 2,
          vy: (Math.random() - 0.5) * layer.speed * 2,
          r: layer.rMin + Math.random() * (layer.rMax - layer.rMin),
          color,
          baseOp: op,
          op,
          layer: li,
          // Phase offset for subtle breathing
          phase: Math.random() * Math.PI * 2,
        });
      }
    });

    // Ambient glow orbs (large, soft, very slow)
    const glowOrbs = Array.from({ length: 3 }, () => ({
      x: Math.random() * (w || 1200),
      y: Math.random() * (h || 800),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      radius: 80 + Math.random() * 120,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      op: 0.015 + Math.random() * 0.025,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const tick = () => {
      frame++;
      ctx.clearRect(0, 0, w, h);
      const time = frame * 0.016; // ~60fps time
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Draw ambient glow orbs
      for (const orb of glowOrbs) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        const pulse = 1 + Math.sin(time * 0.5 + orb.phase) * 0.3;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius * pulse);
        const [r, g, b] = orb.color;
        grad.addColorStop(0, `rgba(${r},${g},${b},${orb.op * pulse})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connection lines (mid + near particles only)
      const connectable = particles.filter(p => p.layer >= 1);
      for (let i = 0; i < connectable.length; i++) {
        for (let j = i + 1; j < connectable.length; j++) {
          const a = connectable[i];
          const b = connectable[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const lineOp = (1 - dist / 130) * 0.15;
            const [cr, cg, cb] = a.color;
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${lineOp})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        // Breathing opacity
        p.op = p.baseOp + Math.sin(time * 0.8 + p.phase) * 0.08;

        // Mouse proximity glow for near particles
        let mouseGlow = 0;
        if (p.layer === 2) {
          const mdx = p.x - mx;
          const mdy = p.y - my;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 150) {
            mouseGlow = (1 - mDist / 150) * 0.4;
          }
        }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;

        const [r, g, b] = p.color;
        const finalOp = Math.min(1, p.op + mouseGlow);

        // Near particles get a subtle glow
        if (p.layer === 2 || mouseGlow > 0) {
          const glowR = p.r * 4;
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
          grad.addColorStop(0, `rgba(${r},${g},${b},${finalOp * 0.3})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = `rgba(${r},${g},${b},${finalOp})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{ opacity: 0.85 }}
    />
  );
}
