"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

function SubscribeSkeleton() {
  return (
    <div role="status" aria-label="Loading subscription form">
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="space-y-5">
          <Skeleton className="h-6 w-56" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

// Client-only: reads the ?plan= preset from the URL.
export const SubscribeLoader = dynamic(
  () => import("./subscribe-flow").then((m) => m.SubscribeFlow),
  { ssr: false, loading: () => <SubscribeSkeleton /> }
)
