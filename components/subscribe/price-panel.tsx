import { CAPACITY, PLANS, SPEED_TIERS } from "@/lib/config"
import { formatPct, formatUSDCents } from "@/lib/format"
import {
  boostProfile,
  getCell,
  monthlyPrice,
  type SeatAvailability,
  type Subscription,
} from "@/lib/simulate"
import { cn } from "@/lib/utils"

/** Live monthly price for the subscription being configured */
export function PricePanel({ sub }: { sub: Subscription }) {
  const plan = PLANS[sub.plan]
  const price = monthlyPrice(sub)
  const boost = boostProfile(sub.plan, sub.speed)

  return (
    <aside
      aria-label="Monthly price"
      className="rounded-lg border border-gray-mid bg-white shadow-card"
    >
      <div className="border-b border-gray-mid p-5">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Your plan
        </p>
        <p className="mt-1 text-lg font-bold text-ink">
          {plan.name} · {SPEED_TIERS[sub.speed].name}
        </p>
        <p
          className="tabular mt-2 text-4xl font-extrabold tracking-[-0.03em] text-ink"
          aria-live="polite"
          aria-atomic="true"
        >
          {formatUSDCents(price.total)}
          <span className="ml-1 text-base font-semibold text-muted-foreground">
            /month
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          First month free · simulated pricing
        </p>
      </div>

      <dl className="tabular space-y-2 p-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{plan.name} plan</dt>
          <dd className="text-ink">{formatUSDCents(price.base)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Speed: {SPEED_TIERS[sub.speed].name}
          </dt>
          <dd className="text-ink">
            {price.speedUpgrade
              ? `+${formatUSDCents(price.speedUpgrade)}`
              : "Included"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">
            Extra hours: {sub.extraHours}
          </dt>
          <dd className="text-ink">
            {price.extraHours ? `+${formatUSDCents(price.extraHours)}` : "None"}
          </dd>
        </div>
        <div className="flex justify-between border-t border-gray-mid pt-2 font-semibold">
          <dt className="text-ink">Monthly total</dt>
          <dd className="text-ink">{formatUSDCents(price.total)}</dd>
        </div>
      </dl>

      <div className="border-t border-gray-mid bg-gray-light p-5">
        <p className="text-xs font-semibold text-ink">What you get</p>
        <ul className="tabular mt-2 space-y-1 text-sm text-ink">
          <li>
            Everyday:{" "}
            {plan.floorMbps
              ? `priority + ${plan.floorMbps} Mbps floor`
              : "priority over regular traffic"}
          </li>
          <li>
            Boost: {boost.throughputMbps} Mbps, ≤{boost.maxLatencyMs} ms,{" "}
            {boost.reliability}%
          </li>
          <li>{price.boostHours} boost hours per month</li>
          <li>{plan.devices.label}</li>
        </ul>
      </div>
    </aside>
  )
}

/** How much of this plan's guaranteed pool is sold on the chosen cell */
export function SeatBar({
  sub,
  seats,
}: {
  sub: Subscription
  seats: SeatAvailability
}) {
  const cell = getCell(sub.cellId)
  const plan = PLANS[sub.plan]
  const sold = Math.min(seats.soldShare, 1)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold text-ink" id="seat-label">
          {plan.name} seats on {cell.name}:{" "}
          <span
            className={cn(
              "tabular",
              seats.soldOut ? "text-danger" : "text-ink"
            )}
          >
            {seats.soldOut ? "sold out" : `${seats.open} open`}
          </span>
        </p>
        <p className="tabular text-xs text-muted-foreground">
          {formatPct(sold)} sold
        </p>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-gray-light"
        role="meter"
        aria-labelledby="seat-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sold * 100)}
        aria-valuetext={`${formatPct(sold)} of ${plan.name} seats sold on ${cell.name}`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300",
            seats.soldOut ? "bg-danger" : "bg-gray-dark"
          )}
          style={{ width: `${sold * 100}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Each cell reserves at most {formatPct(CAPACITY.guaranteedPoolCap)} of
        its capacity for guarantees. {plan.name} plans get{" "}
        {formatPct(plan.poolShare)} of that. Faster tiers use more of it, so
        they have fewer seats.
      </p>
    </div>
  )
}
