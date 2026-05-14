import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function getColor(score) {
  if (score >= 80) return { stroke: 'oklch(0.72 0.19 142)', glow: '0 0 30px oklch(0.72 0.19 142 / 30%)' };
  if (score >= 60) return { stroke: 'oklch(0.75 0.18 80)', glow: '0 0 30px oklch(0.75 0.18 80 / 30%)' };
  if (score >= 40) return { stroke: 'oklch(0.7 0.2 55)', glow: '0 0 30px oklch(0.7 0.2 55 / 30%)' };
  return { stroke: 'oklch(0.63 0.24 25)', glow: '0 0 30px oklch(0.63 0.24 25 / 30%)' };
}

function getLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

export default function CircularScore({ score = 0, size = 180, strokeWidth = 10, label = 'ATS Score' }) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 100) * circumference;
  const color = getColor(score);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * score);
      setDisplayScore(start);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="score-ring" style={{ filter: `drop-shadow(${color.glow})` }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-heading font-bold"
            key={displayScore}
          >
            {displayScore}
          </motion.span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
      </div>

      <div
        className="px-3 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${color.stroke}20`, color: color.stroke }}
      >
        {getLabel(score)}
      </div>
    </div>
  );
}
