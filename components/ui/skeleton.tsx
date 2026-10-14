import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn("animate-pulse rounded-lg bg-gray-light", className)}
    />
  )
}

/** Placeholder sized like a ChartCard while a chart bundle loads */
export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="rounded-lg border border-gray-mid bg-white p-5 shadow-card sm:p-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-2 h-3 w-64 max-w-full" />
      <div style={{ height }} className="mt-4 flex items-end gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            // Static, varied heights so the placeholder reads as a chart
            style={{ height: `${30 + ((i * 37) % 60)}%` }}
          />
        ))}
      </div>
      <span className="sr-only" role="status">
        Loading chart
      </span>
    </div>
  )
}
