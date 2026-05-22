import { useEffect, useRef, useState } from 'react';

/**
 * AnimatedCounter — animates a number from 0 to `target` on mount.
 * Triggers when the element enters the viewport.
 */
export default function AnimatedCounter({ target, suffix = '', prefix = '', duration = 1800, className = '' }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    const targetNum = typeof target === 'string' ? parseFloat(target) : target;

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * targetNum));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(targetNum);
    };

    requestAnimationFrame(tick);
  }, [started, target, duration]);

  const display = typeof target === 'string' && target.includes('.')
    ? count.toFixed(1)
    : count.toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
