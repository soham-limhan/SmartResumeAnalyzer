export default function LoadingSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded-lg animate-shimmer"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }) {
  return (
    <div className={`glass rounded-2xl p-6 space-y-4 ${className}`}>
      <div className="h-5 w-1/3 rounded-lg animate-shimmer" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded animate-shimmer" />
        <div className="h-3 w-4/5 rounded animate-shimmer" />
        <div className="h-3 w-3/5 rounded animate-shimmer" />
      </div>
      <div className="flex gap-2 pt-2">
        <div className="h-6 w-16 rounded-full animate-shimmer" />
        <div className="h-6 w-20 rounded-full animate-shimmer" />
        <div className="h-6 w-14 rounded-full animate-shimmer" />
      </div>
    </div>
  );
}

export function ScoreSkeleton() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-40 h-40 rounded-full animate-shimmer" />
    </div>
  );
}
