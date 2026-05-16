import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

const RADIUS = 90;
const CIRCUMFERENCE = Math.PI * RADIUS;

export default function ScoreArcGauge({ score = 0, size = 200, label = 'R SCORE' }) {
  const scoreMotion = useMotionValue(0);
  const smoothScore = useSpring(scoreMotion, { damping: 15, stiffness: 55 });
  const [displayScore, setDisplayScore] = useState(0);

  const strokeOffset = useTransform(smoothScore, [0, 1], [CIRCUMFERENCE, 0]);
  const strokeColor = useTransform(
    smoothScore,
    [0, 0.5, 0.75, 1],
    ['#FB7185', '#FBBF24', '#34D399', '#059669'],
  );

  useEffect(() => {
    const ctrl1 = animate(scoreMotion, score, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    const ctrl2 = animate(0, score * 100, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayScore(Math.round(v * 10) / 10),
    });
    return () => { ctrl1.stop(); ctrl2.stop(); };
  }, [score, scoreMotion]);

  const height = size * 0.65;

  return (
    <div className="relative" style={{ width: size, height }}>
      <svg viewBox="0 0 200 120" width={size} height={height} style={{ overflow: 'visible' }}>
        {/* Track */}
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Fill */}
        <motion.path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          style={{ stroke: strokeColor, strokeDashoffset: strokeOffset }}
          strokeDasharray={CIRCUMFERENCE}
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score number */}
        <text
          x="100" y="95"
          textAnchor="middle"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 34, fontWeight: 700, fill: '#0F172A' }}
        >
          {displayScore.toFixed(1)}
        </text>
        {/* Label */}
        <text
          x="100" y="114"
          textAnchor="middle"
          style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: '#94A3B8', letterSpacing: 2.5 }}
        >
          {label}
        </text>
      </svg>
    </div>
  );
}
