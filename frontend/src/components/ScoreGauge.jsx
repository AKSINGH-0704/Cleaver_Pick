import { useEffect, useState } from 'react';
import { scoreColor } from '../utils/colors';

export default function ScoreGauge({ score = 0, size = 120, label = 'R Score' }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), 120);
    return () => clearTimeout(timer);
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;
  const radius = cx - 14;
  // Half-circle arc from 180° to 0° (left to right)
  const startX = 14;
  const startY = cy;
  const endX = size - 14;
  const endY = cy;
  const arcLen = Math.PI * radius;
  const offset = arcLen * (1 - Math.min(Math.max(displayed, 0), 1));
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={cy + 20}
        viewBox={`0 0 ${size} ${cy + 20}`}
        style={{ overflow: 'visible' }}
      >
        {/* Background arc */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.4s ease' }}
        />
        {/* Score number */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill={color}
          fontSize="24"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
          style={{ transition: 'fill 0.4s ease' }}
        >
          {(displayed * 100).toFixed(0)}
        </text>
        {/* Label */}
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fill="#475569"
          fontSize="9"
          fontFamily="Space Mono, monospace"
          letterSpacing="1"
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}
