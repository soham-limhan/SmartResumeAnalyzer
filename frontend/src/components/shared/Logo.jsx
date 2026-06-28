/**
 * ProfileX AI — inline SVG logo component.
 *
 * Props:
 *   size       – icon height in px  (default 32)
 *   showText   – render the "ProfileX AI" wordmark beside the icon (default true)
 *   className  – forwarded to the outer wrapper
 */
export default function Logo({ size = 32, showText = true, className = '' }) {
  const iconSize = size;
  const fontSize = Math.max(size * 0.45, 12);

  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* ── Icon mark ──────────────────────────────────── */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="sr-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.72" />
          </linearGradient>
          <linearGradient id="sr-sparkle" x1="28" y1="4" x2="36" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Rounded square background */}
        <rect width="40" height="40" rx="10" fill="url(#sr-bg)" />

        {/* Document body */}
        <rect x="11" y="8" width="16" height="22" rx="2.5" fill="white" fillOpacity="0.95" />

        {/* Document lines */}
        <rect x="14.5" y="13" width="9" height="1.6" rx="0.8" fill="var(--primary)" fillOpacity="0.35" />
        <rect x="14.5" y="17" width="7" height="1.6" rx="0.8" fill="var(--primary)" fillOpacity="0.25" />
        <rect x="14.5" y="21" width="10" height="1.6" rx="0.8" fill="var(--primary)" fillOpacity="0.35" />
        <rect x="14.5" y="25" width="5" height="1.6" rx="0.8" fill="var(--primary)" fillOpacity="0.2" />

        {/* Sparkle / star accent */}
        <path
          d="M32 6 L33.2 9.5 L37 10 L33.8 12.5 L34.5 16 L32 13.8 L29.5 16 L30.2 12.5 L27 10 L30.8 9.5 Z"
          fill="url(#sr-sparkle)"
        />
      </svg>

      {/* ── Wordmark ───────────────────────────────────── */}
      {showText && (
        <span
          className="font-heading font-extrabold tracking-tight text-foreground"
          style={{ fontSize, lineHeight: 1.1 }}
        >
          ProfileX <span className="text-primary">AI</span>
        </span>
      )}
    </span>
  );
}
