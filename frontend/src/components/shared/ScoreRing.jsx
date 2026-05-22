import { useEffect, useState } from 'react';

/**
 * ScoreRing — premium animated circular score display.
 * Larger and more visually rich than CircularScore.
 */
export default function ScoreRing({
  score = 0,
  size = 180,
  strokeWidth = 12,
  label = 'ATS Score',
  sublabel = null,
  animate = true,
  className = '',
}) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = displayScore / 100;
  const dashOffset = circumference * (1 - progress);

  const color =
    displayScore >= 80 ? '#22c55e'
    : displayScore >= 60 ? '#f59e0b'
    : '#ef4444';

  const glowColor =
    displayScore >= 80 ? '34 197 94'
    : displayScore >= 60 ? '245 158 11'
    : '239 68 68';

  useEffect(() => {
    if (!animate) { setDisplayScore(score); return; }
    let raf;
    const start = performance.now();
    const duration = 1800;
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayScore(Math.round(ease * score));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, animate]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background glow */}
        <div
          className="absolute inset-0 rounded-full opacity-20 blur-xl"
          style={{ background: `rgb(${glowColor})` }}
        />

        <svg
          width={size}
          height={size}
          className="score-ring drop-shadow-lg"
          style={{ filter: `drop-shadow(0 0 12px rgba(${glowColor}, 0.4))` }}
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="oklch(1 0 0 / 8%)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#score-gradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
          <defs>
            <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-heading font-bold leading-none"
            style={{ fontSize: size * 0.24, color }}
          >
            {displayScore}
          </span>
          <span className="text-xs text-muted-foreground mt-1 font-medium">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}
