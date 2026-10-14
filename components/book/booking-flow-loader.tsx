"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

export function BookingFlowSkeleton() {
  return (
    <div role="status" aria-label="Loading booking form">
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="space-y-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <div className="grid grid-cols-2 gap-5">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}

// Client-only: defaults depend on today's date in the visitor's time zone.
export const BookingFlowLoader = dynamic(
  () => import("./booking-flow").then((m) => m.BookingFlow),
  { ssr: false, loading: () => <BookingFlowSkeleton /> }
)
