import { useEffect, useRef } from 'react';

/**
 * Animated Canvas Audio Visualizer.
 * Renders dynamic pulsating waveforms or frequency spectrum bars from AnalyserNode.
 */
export default function AudioVisualizer({
  analyserNode,
  isRecording = false,
  isPaused = false,
  className = '',
  barCount = 36,
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let dataArray = null;

    if (analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
    }

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!isRecording) {
        // Idle flat animated subtle baseline
        const time = Date.now() * 0.003;
        const barWidth = width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const idleHeight = 4 + Math.sin(time + i * 0.3) * 2;
          const x = i * (barWidth + 2);
          const y = (height - idleHeight) / 2;

          ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, idleHeight, 3);
          ctx.fill();
        }
        return;
      }

      if (isPaused) {
        // Paused visual indicator
        const barWidth = width / barCount - 2;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 2);
          const y = (height - 6) / 2;
          ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, 6, 3);
          ctx.fill();
        }
        return;
      }

      if (analyserNode && dataArray) {
        analyserNode.getByteFrequencyData(dataArray);

        const barWidth = width / barCount - 2.5;
        const step = Math.floor(dataArray.length / barCount) || 1;

        for (let i = 0; i < barCount; i++) {
          const val = dataArray[i * step] || 0;
          const percent = val / 255;
          const barHeight = Math.max(6, percent * (height - 8));
          const x = i * (barWidth + 2.5);
          const y = (height - barHeight) / 2;

          // Gradient color: Cyan to Violet to Crimson
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#06b6d4'); // Cyan
          gradient.addColorStop(0.5, '#6366f1'); // Indigo
          gradient.addColorStop(1, '#a855f7'); // Purple

          ctx.fillStyle = gradient;
          ctx.shadowColor = 'rgba(99, 102, 241, 0.5)';
          ctx.shadowBlur = 8;

          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 4);
          ctx.fill();

          ctx.shadowBlur = 0; // reset
        }
      } else {
        // Simulated audio wave if analyzer is unavailable
        const time = Date.now() * 0.006;
        const barWidth = width / barCount - 2;

        for (let i = 0; i < barCount; i++) {
          const noise = Math.sin(time + i * 0.4) * Math.cos(time * 0.5 + i * 0.2);
          const barHeight = Math.max(6, Math.abs(noise) * (height - 10));
          const x = i * (barWidth + 2);
          const y = (height - barHeight) / 2;

          ctx.fillStyle = '#6366f1';
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 3);
          ctx.fill();
        }
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyserNode, isRecording, isPaused, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={56}
      className={`w-full max-w-md h-14 rounded-xl bg-secondary/30 backdrop-blur-sm border border-border/50 px-2 ${className}`}
    />
  );
}
