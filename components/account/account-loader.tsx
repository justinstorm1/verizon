"use client"

import dynamic from "next/dynamic"

import { ChartSkeleton, Skeleton } from "@/components/ui/skeleton"

function AccountSkeleton() {
  return (
    <div role="status" aria-label="Loading account" className="space-y-6">
      <Skeleton className="h-24" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <ChartSkeleton height={220} />
    </div>
  )
}

// Client-only: reads the subscription from the URL and keeps local state.
export const AccountLoader = dynamic(
  () => import("./account-dashboard").then((m) => m.AccountDashboard),
  { ssr: false, loading: () => <AccountSkeleton /> }
)
