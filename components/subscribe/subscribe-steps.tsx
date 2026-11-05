"use client"

import { TriangleAlert } from "lucide-react"
import { useEffect, useState } from "react"

import { EligibilityCheck } from "@/components/eligibility-check"
import { PLAN_ICONS } from "@/components/plan-icon"
import { Field } from "@/components/ui/field"
import { Select } from "@/components/ui/select"
import {
  CELLS,
  DEVICE_TYPES,
  EXTRA_HOURS,
  PLAN_ORDER,
  PLANS,
  SPEED_TIER_ORDER,
  SPEED_TIERS,
  type DeviceTypeId,
  type PlanId,
  type SpeedTierId,
} from "@/lib/config"
import { formatUSD, formatUSDCents } from "@/lib/format"
import {
  boostProfile,
  checkEligibility,
  getCell,
  getDevice,
  monthlyPrice,
  type SeatAvailability,
  type Subscription,
} from "@/lib/simulate"
import { cn } from "@/lib/utils"

import { SeatBar } from "./price-panel"

const radioCard =
  "relative flex cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink"

// ---------------------------------------------------------------------------
// Step 1: choose a plan
// ---------------------------------------------------------------------------

export function StepPlan({
  plan,
  onPlanChange,
}: {
  plan: PlanId
  onPlanChange: (id: PlanId) => void
}) {
  return (
    <fieldset>
      <legend className="text-xl font-bold text-ink">
        Who is this plan for?
      </legend>
      <p className="mt-1 text-sm text-muted-foreground">
        You can change speed and add hours in step 3.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id]
          const Icon = PLAN_ICONS[id]
          const checked = plan === id
          return (
            <label
              key={id}
              className={cn(
                radioCard,
                checked
                  ? "border-brand-red bg-[#fff8f8]"
                  : "border-gray-mid hover:border-gray-dark"
              )}
            >
              <input
                type="radio"
                name="plan"
                value={id}
                checked={checked}
                onChange={() => onPlanChange(id)}
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  checked ? "bg-brand-red text-white" : "bg-gray-light text-ink"
                )}
                aria-hidden="true"
              >
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-ink">{p.name}</span>
                  <span className="tabular text-sm font-bold text-ink">
                    {formatUSD(p.price)}/mo
                  </span>
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {p.tagline}
                </span>
                <span className="tabular mt-2 block text-xs text-ink">
                  {p.boost.throughputMbps} Mbps boost · ≤{p.boost.maxLatencyMs}{" "}
                  ms · {p.boostHours} h/month · {p.devices.label.toLowerCase()}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

// ---------------------------------------------------------------------------
// Step 2: eligibility (simulated)
// ---------------------------------------------------------------------------

export function StepEligibility({
  cellId,
  deviceId,
  onCellChange,
  onDeviceChange,
}: {
  cellId: string
  deviceId: DeviceTypeId
  onCellChange: (id: string) => void
  onDeviceChange: (id: DeviceTypeId) => void
}) {
  const results = checkEligibility(cellId, deviceId)
  // Simulated lookup delay so pass/fail reads as a real check.
  const key = `${cellId}|${deviceId}`
  const [doneKey, setDoneKey] = useState<string | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => setDoneKey(key), 900)
    return () => window.clearTimeout(t)
  }, [key])
  const checking = doneKey !== key
  const failed = results.filter((r) => r.status === "fail").length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Check eligibility</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Guarantees need standalone 5G where you&apos;ll use them and devices
          that can join the slice. These checks are simulated.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="cell"
          label="Where on campus will you use it most?"
          hint={getCell(cellId).kind}
        >
          <Select
            id="cell"
            value={cellId}
            aria-describedby="cell-hint"
            onChange={(e) => onCellChange(e.target.value)}
          >
            {CELLS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          id="device"
          label="Main device type"
          hint="You can add others later."
        >
          <Select
            id="device"
            value={deviceId}
            aria-describedby="device-hint"
            onChange={(e) => onDeviceChange(e.target.value as DeviceTypeId)}
          >
            {DEVICE_TYPES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <EligibilityCheck
        results={results}
        checking={checking}
        onFix={(fix) => {
          if (fix.cellId) onCellChange(fix.cellId)
          if (fix.deviceId) onDeviceChange(fix.deviceId)
        }}
      />
      <p className="sr-only" role="status">
        {checking
          ? "Running eligibility checks"
          : failed
            ? `${failed} check${failed > 1 ? "s" : ""} failed. A suggested fix is shown.`
            : "All eligibility checks passed."}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: customize speed and time, check seats
// ---------------------------------------------------------------------------

export function StepCustomize({
  sub,
  seats,
  lowerTierWithSeats,
  cellWithSeats,
  onSpeedChange,
  onExtraHoursChange,
  onCellChange,
}: {
  sub: Subscription
  seats: SeatAvailability
  lowerTierWithSeats: SpeedTierId | null
  cellWithSeats: string | null
  onSpeedChange: (id: SpeedTierId) => void
  onExtraHoursChange: (hours: number) => void
  onCellChange: (id: string) => void
}) {
  const plan = PLANS[sub.plan]
  const price = monthlyPrice(sub)

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-xl font-bold text-ink">Speed</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          Sets your guarantee while boosting. Everyday priority is the same on
          every tier.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {SPEED_TIER_ORDER.map((t) => {
            const tier = SPEED_TIERS[t]
            const b = boostProfile(sub.plan, t)
            const checked = sub.speed === t
            return (
              <label
                key={t}
                className={cn(
                  radioCard,
                  "flex-col gap-1",
                  checked
                    ? "border-ink bg-ink text-white"
                    : "border-gray-mid text-ink hover:border-gray-dark"
                )}
              >
                <input
                  type="radio"
                  name="speed"
                  value={t}
                  checked={checked}
                  onChange={() => onSpeedChange(t)}
                  className="sr-only"
                />
                <span className="font-bold">{tier.name}</span>
                <span className="tabular text-sm">
                  {b.throughputMbps} Mbps · ≤{b.maxLatencyMs} ms
                </span>
                <span
                  className={cn(
                    "tabular text-xs",
                    checked ? "text-gray-mid" : "text-muted-foreground"
                  )}
                >
                  {tier.priceUplift
                    ? `+${formatUSDCents(plan.price * tier.priceUplift)}/mo`
                    : "Included"}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <div>
        <div className="flex items-baseline justify-between">
          <label
            htmlFor="extra-hours"
            className="text-sm font-semibold text-ink"
          >
            Extra boost hours each month
          </label>
          <span className="tabular text-2xl font-extrabold text-ink">
            +{sub.extraHours}
            <span className="ml-1 text-sm font-semibold text-muted-foreground">
              h
            </span>
          </span>
        </div>
        <input
          id="extra-hours"
          type="range"
          {...EXTRA_HOURS.monthly}
          value={sub.extraHours}
          aria-describedby="extra-hours-hint"
          aria-valuetext={`${sub.extraHours} extra hours, ${price.boostHours} hours total`}
          onChange={(e) => onExtraHoursChange(Number(e.target.value))}
          className="mt-2 w-full cursor-pointer"
        />
        <p id="extra-hours-hint" className="mt-1 text-xs text-muted-foreground">
          {plan.boostHours} hours included + {sub.extraHours} extra ={" "}
          <span className="font-semibold text-ink">
            {price.boostHours} hours
          </span>{" "}
          per month, at {formatUSDCents(plan.extraHourPrice)} per extra hour.
        </p>
      </div>

      <div className="rounded-lg border border-gray-mid p-5">
        <SeatBar sub={sub} seats={seats} />
        {seats.soldOut ? (
          <div
            role="alert"
            className="mt-4 flex gap-2 rounded-lg border border-danger/30 bg-danger-tint p-3 text-sm text-danger"
          >
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p>
                {plan.name} {SPEED_TIERS[sub.speed].name} is full on{" "}
                {getCell(sub.cellId).name}. We don&apos;t oversell guarantees,
                so you can pick another option or join the waitlist.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                {lowerTierWithSeats ? (
                  <button
                    type="button"
                    onClick={() => onSpeedChange(lowerTierWithSeats)}
                    className="font-semibold underline underline-offset-4 hover:text-ink"
                  >
                    Switch to {SPEED_TIERS[lowerTierWithSeats].name} speed
                  </button>
                ) : null}
                {cellWithSeats ? (
                  <button
                    type="button"
                    onClick={() => onCellChange(cellWithSeats)}
                    className="font-semibold underline underline-offset-4 hover:text-ink"
                  >
                    Use {getCell(cellWithSeats).name} instead
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4: review
// ---------------------------------------------------------------------------

export function StepReview({
  sub,
  deviceId,
  waitlist,
}: {
  sub: Subscription
  deviceId: DeviceTypeId
  waitlist: boolean
}) {
  const plan = PLANS[sub.plan]
  const price = monthlyPrice(sub)
  const boost = boostProfile(sub.plan, sub.speed)
  const cell = getCell(sub.cellId)
  const rows: [string, string][] = [
    ["Plan", `${plan.name} (${plan.devices.label.toLowerCase()})`],
    ["Speed tier", SPEED_TIERS[sub.speed].name],
    [
      "Boost guarantee",
      `${boost.throughputMbps} Mbps, ≤${boost.maxLatencyMs} ms, ${boost.reliability}%`,
    ],
    ["Boost hours", `${price.boostHours} per month`],
    ["Home cell", cell.name],
    ["Main device", getDevice(deviceId).label],
    ["Monthly total", `${formatUSDCents(price.total)} (first month free)`],
  ]
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">
        {waitlist ? "Join the waitlist" : "Review your subscription"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {waitlist
          ? "This plan is full on your cell right now. We'll hold your place and start your subscription when a seat opens."
          : "Confirm the details below. You can go back and change anything."}
      </p>
      <dl className="mt-5 divide-y divide-gray-mid rounded-lg border border-gray-mid">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[1fr_1.5fr] gap-4 px-4 py-3 text-sm sm:px-5"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="tabular text-right font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Concept terms (illustrative)
      </p>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        <li>· Unused boost hours roll over for one month.</li>
        <li>
          · If a boost misses its guarantee, that hour is refunded
          automatically.
        </li>
        <li>· Change speed, add hours, or cancel any time.</li>
      </ul>
    </div>
  )
}
