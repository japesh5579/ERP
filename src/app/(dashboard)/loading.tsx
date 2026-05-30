import React from 'react'

function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-md bg-muted relative overflow-hidden ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 pt-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <Shimmer className="h-2.5 w-20" />
          <Shimmer className="h-7 w-16 mt-1" />
          <Shimmer className="h-2 w-24 mt-1" />
        </div>
        <Shimmer className="w-9 h-9 rounded-lg flex-shrink-0" />
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page heading skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Shimmer className="h-5 w-36" />
          <Shimmer className="h-3 w-52" />
        </div>
        <Shimmer className="h-9 w-28 rounded-md" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main content area — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wide panel (chart) */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-5 space-y-4">
          <Shimmer className="h-4 w-40" />
          <Shimmer className="h-[220px] w-full rounded-md" />
        </div>

        {/* Narrow panel (list) */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <Shimmer className="h-4 w-32 mb-1" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="w-7 h-7 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-2.5 w-full" />
                <Shimmer className="h-2 w-3/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <Shimmer className="h-4 w-36" />
          <Shimmer className="h-8 w-24 rounded-md" />
        </div>
        {/* Header row */}
        <div className="grid grid-cols-5 gap-3 pb-2 border-b border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer key={i} className="h-2.5" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-3 py-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <Shimmer key={j} className="h-3" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
