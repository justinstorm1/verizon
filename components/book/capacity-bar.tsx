import { TriangleAlert } from "lucide-react"

import { CAPACITY } from "@/lib/config"
import { formatPct } from "@/lib/format"
import type { Quote } from "@/lib/simulate"
import { cn } from "@/lib/utils"

/**
 * Stacked bar: capacity already reserved by others (gray) + this booking (red),
 * with a marker at the maximum reservable share.
 */
export function CapacityBar({
  quote,
  venueName,
  onFitThroughput,
  alternateTime,
}: {
  quote: Quote
  venueName: string
  /** Offered when the booking is oversold and a smaller slice would fit */
  onFitThroughput?: (mbps: number) => void
  /** Nearest time window that fits, offered when the booking is oversold */
  alternateTime?: { label: string; apply: () => void } | null
}) {
  const existing = Math.min(quote.peakExisting, 1)
  const yours = Math.max(0, Math.min(quote.requestShare, 1 - existing))
  const total = quote.peakTotal
  const limit = CAPACITY.maxReservable

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold text-ink" id="capacity-label">
          Site capacity reserved:{" "}
          <span
            className={cn(
              "tabular",
              quote.oversold ? "text-danger" : "text-ink"
            )}
          >
            {formatPct(total)}
          </span>
        </p>
        <p className="tabular text-xs text-muted-foreground">
          Limit {formatPct(limit)}
        </p>
      </div>
      <div
        className="relative mt-2 h-4 overflow-hidden rounded-full bg-gray-light"
        role="meter"
        aria-labelledby="capacity-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(total * 100)}
        aria-valuetext={`${formatPct(total)} of ${venueName} site capacity reserved at the busiest hour, including this booking. Limit is ${formatPct(limit)}.`}
      >
        <div className="flex h-full">
          <div
            className="h-full bg-gray-dark transition-[width] duration-300"
            style={{ width: `${existing * 100}%` }}
          />
          <div
            className={cn(
              "h-full border-l-2 border-white transition-[width] duration-300",
              quote.oversold
                ? "bg-[repeating-linear-gradient(135deg,var(--brand-red)_0_6px,#ff6b6b_6px_10px)]"
                : "bg-brand-red"
            )}
            style={{ width: `${yours * 100}%` }}
          />
        </div>
        <div
          className="absolute inset-y-0 w-0.5 bg-ink"
          style={{ left: `${limit * 100}%` }}
          aria-hidden="true"
        />
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm bg-gray-dark"
            aria-hidden="true"
          />
          Other customers {formatPct(quote.peakExisting)}
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm bg-brand-red"
            aria-hidden="true"
          />
          This booking {formatPct(quote.requestShare)}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 bg-ink" aria-hidden="true" />
          Max reservable
        </li>
      </ul>
      {quote.oversold ? (
        <div
          role="alert"
          className="mt-3 flex gap-2 rounded-lg border border-danger/30 bg-danger-tint p-3 text-sm text-danger"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p>
              Booking blocked: this would oversell {venueName} at its busiest
              hour.{" "}
              {alternateTime
                ? `The nearest window with room is ${alternateTime.label}.`
                : "No other window that day has room for this slice."}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
              {alternateTime ? (
                <button
                  type="button"
                  onClick={alternateTime.apply}
                  className="font-semibold text-danger underline underline-offset-4 hover:text-ink"
                >
                  Move to {alternateTime.label}
                </button>
              ) : null}
              {onFitThroughput && quote.maxThroughputMbps >= 5 ? (
                <button
                  type="button"
                  onClick={() => onFitThroughput(quote.maxThroughputMbps)}
                  className="font-semibold text-danger underline underline-offset-4 hover:text-ink"
                >
                  Or lower to {quote.maxThroughputMbps} Mbps
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
