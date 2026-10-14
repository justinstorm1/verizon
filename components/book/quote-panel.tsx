import { Lightbulb } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PRICING, USE_CASES } from "@/lib/config"
import { formatMultiplier, formatUSD, formatUSDCents } from "@/lib/format"
import {
  getVenue,
  hourLabel,
  type BookingRequest,
  type Quote,
} from "@/lib/simulate"
import { cn } from "@/lib/utils"

const BAND_STYLES = {
  peak: "bg-ink text-white",
  standard: "bg-gray-mid text-ink",
  "off-peak": "bg-white text-ink border border-gray-mid",
} as const

export function QuotePanel({
  request,
  quote,
  alternative,
  onApplyAlternative,
}: {
  request: BookingRequest
  quote: Quote
  alternative: { startHour: number; total: number; savingsPct: number } | null
  onApplyAlternative?: (startHour: number) => void
}) {
  const venue = getVenue(request.venueId)
  const uc = USE_CASES[request.useCase]
  const endHour = request.startHour + request.durationHours

  return (
    <aside
      aria-label="Price quote"
      className="rounded-lg border border-gray-mid bg-white shadow-card"
    >
      <div className="border-b border-gray-mid p-5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Live quote
        </p>
        <p
          className="tabular mt-1 text-4xl font-extrabold tracking-[-0.03em] text-ink"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatUSD(quote.total)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {uc.label} · {venue.name}
          <br />
          {hourLabel(request.startHour)} to {hourLabel(endHour)} (
          {request.durationHours} h)
        </p>
      </div>

      <dl className="tabular space-y-2 p-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Base rate</dt>
          <dd className="text-ink">
            {formatUSDCents(PRICING.baseHourlyRate)}/hr
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Demand multiplier (avg)</dt>
          <dd className="text-ink">
            {formatMultiplier(quote.avgDemandMultiplier)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Profile multiplier</dt>
          <dd className="text-ink">
            {formatMultiplier(quote.profileMultiplier)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Hours</dt>
          <dd className="text-ink">× {request.durationHours}</dd>
        </div>
        {quote.total > quote.subtotal ? (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Minimum charge applied</dt>
            <dd className="text-ink">{formatUSD(PRICING.minimumCharge)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between border-t border-gray-mid pt-2 font-semibold">
          <dt className="text-ink">Total</dt>
          <dd className="text-ink">{formatUSDCents(quote.total)}</dd>
        </div>
      </dl>

      <div className="border-t border-gray-mid p-5">
        <p className="text-xs font-semibold text-ink">Demand by hour</p>
        <ul className="mt-2 grid grid-cols-4 gap-1.5">
          {quote.hours.map((h) => (
            <li
              key={h.hour}
              className={cn(
                "rounded-md px-1.5 py-1 text-center text-[11px] leading-tight",
                BAND_STYLES[h.band]
              )}
            >
              <span className="block font-semibold">{hourLabel(h.hour)}</span>
              <span className="tabular">
                {formatMultiplier(h.demandMultiplier)}
              </span>
              <span className="sr-only">
                , {PRICING.demandBands[h.band].label} demand
              </span>
            </li>
          ))}
        </ul>
        <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {(["peak", "standard", "off-peak"] as const).map((b) => (
            <li key={b} className="flex items-center gap-1">
              <span
                className={cn("size-2.5 rounded-sm", BAND_STYLES[b])}
                aria-hidden="true"
              />
              {PRICING.demandBands[b].label}
            </li>
          ))}
        </ul>
      </div>

      {alternative ? (
        <div className="border-t border-gray-mid bg-gray-light p-5">
          <p className="flex gap-2 text-sm text-ink">
            <Lightbulb
              className="mt-0.5 size-4 shrink-0 text-brand-red"
              aria-hidden="true"
            />
            <span>
              Start at <strong>{hourLabel(alternative.startHour)}</strong> to
              pay{" "}
              <strong className="tabular">
                {formatUSD(alternative.total)}
              </strong>
              , saving {Math.round(alternative.savingsPct * 100)}%.
            </span>
          </p>
          {onApplyAlternative ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onApplyAlternative(alternative.startHour)}
            >
              Switch to {hourLabel(alternative.startHour)}
            </Button>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}
