"use client"
export function SkeletonPanel({ lines = 4, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`} aria-busy aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-white/06"
          style={{ width: `${75 + Math.sin(i * 1.7) * 20}%` }}
        />
      ))}
    </div>
  )
}
