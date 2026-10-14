"use client"

import dynamic from "next/dynamic"

import { ChartSkeleton, Skeleton } from "@/components/ui/skeleton"

function BusinessSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading business case"
      className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8"
    >
      <Skeleton className="h-[560px]" />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <ChartSkeleton height={300} />
      </div>
    </div>
  )
}

// Client-only: charts measure their container on mount.
export const BusinessLoader = dynamic(
  () => import("./business-dashboard").then((m) => m.BusinessDashboard),
  { ssr: false, loading: () => <BusinessSkeleton /> }
)
