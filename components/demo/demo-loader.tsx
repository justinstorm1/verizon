"use client"

import dynamic from "next/dynamic"

import { ChartSkeleton, Skeleton } from "@/components/ui/skeleton"

function DemoSkeleton() {
  return (
    <div role="status" aria-label="Loading live demo" className="space-y-6">
      <Skeleton className="h-24" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
      </div>
    </div>
  )
}

// Client-only: the simulation runs on timers and charts measure the DOM.
export const DemoLoader = dynamic(
  () => import("./demo-dashboard").then((m) => m.DemoDashboard),
  { ssr: false, loading: () => <DemoSkeleton /> }
)
