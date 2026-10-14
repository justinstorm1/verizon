"use client"

import { RotateCcw, Sparkles } from "lucide-react"

import { USE_CASE_ICONS } from "@/components/use-case-icon"
import { Field, controlClass } from "@/components/ui/field"
import { Select } from "@/components/ui/select"
import {
  BOOKING,
  CAPACITY,
  PROFILE_LIMITS,
  USE_CASE_ORDER,
  USE_CASES,
  VENUES,
  type Reliability,
  type SliceProfile,
  type UseCaseId,
} from "@/lib/config"
import { formatDateLong, formatInt, formatUSD } from "@/lib/format"
import {
  getVenue,
  hourLabel,
  type BookingRequest,
  type Quote,
} from "@/lib/simulate"
import { cn } from "@/lib/utils"

import { CapacityBar } from "./capacity-bar"

// ---------------------------------------------------------------------------
// Step 1: where, when, what
// ---------------------------------------------------------------------------

export function StepDetails({
  request,
  minDate,
  onChange,
  onUseCaseChange,
}: {
  request: BookingRequest
  minDate: string
  onChange: (patch: Partial<BookingRequest>) => void
  onUseCaseChange: (id: UseCaseId) => void
}) {
  const venue = getVenue(request.venueId)
  const startOptions = []
  for (let h = BOOKING.earliestStartHour; h < BOOKING.latestEndHour; h++)
    startOptions.push(h)
  const maxDuration = Math.min(
    BOOKING.maxDurationHours,
    BOOKING.latestEndHour - request.startHour
  )

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-xl font-bold text-ink">Where and when</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field
            id="venue"
            label="Location"
            className="sm:col-span-2"
            hint={`${venue.kind} · ${formatInt(venue.sliceableCapacityMbps)} Mbps sliceable capacity`}
          >
            <Select
              id="venue"
              value={request.venueId}
              aria-describedby="venue-hint"
              onChange={(e) => onChange({ venueId: e.target.value })}
            >
              {VENUES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id="date"
            label="Date"
            className="sm:col-span-2"
            hint={request.dateISO ? formatDateLong(request.dateISO) : undefined}
          >
            <input
              id="date"
              type="date"
              className={controlClass}
              value={request.dateISO}
              min={minDate}
              required
              aria-describedby="date-hint"
              onChange={(e) =>
                e.target.value && onChange({ dateISO: e.target.value })
              }
            />
          </Field>
          <Field id="start" label="Start time">
            <Select
              id="start"
              value={request.startHour}
              onChange={(e) => {
                const startHour = Number(e.target.value)
                onChange({
                  startHour,
                  durationHours: Math.min(
                    request.durationHours,
                    BOOKING.latestEndHour - startHour
                  ),
                })
              }}
            >
              {startOptions.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            id="duration"
            label="Duration"
            hint={`Ends at ${hourLabel(request.startHour + request.durationHours)}`}
          >
            <Select
              id="duration"
              value={request.durationHours}
              aria-describedby="duration-hint"
              onChange={(e) =>
                onChange({ durationHours: Number(e.target.value) })
              }
            >
              {Array.from({ length: maxDuration }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? "hour" : "hours"}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xl font-bold text-ink">Use case</legend>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll recommend a slice profile in the next step.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {USE_CASE_ORDER.map((id) => {
            const uc = USE_CASES[id]
            const Icon = USE_CASE_ICONS[id]
            const checked = request.useCase === id
            return (
              <label
                key={id}
                className={cn(
                  "relative flex cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                  checked
                    ? "border-brand-red bg-[#fff8f8]"
                    : "border-gray-mid hover:border-gray-dark"
                )}
              >
                <input
                  type="radio"
                  name="use-case"
                  value={id}
                  checked={checked}
                  onChange={() => onUseCaseChange(id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    checked
                      ? "bg-brand-red text-white"
                      : "bg-gray-light text-ink"
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold text-ink">
                    {uc.label}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {uc.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: slice profile, price, capacity
// ---------------------------------------------------------------------------

function RangeField({
  id,
  label,
  value,
  unit,
  min,
  max,
  step,
  hint,
  valueText,
  onChange,
}: {
  id: string
  label: string
  value: number
  unit: string
  min: number
  max: number
  step: number
  hint: string
  valueText: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        <span className="tabular text-2xl font-extrabold text-ink">
          {value}
          <span className="ml-1 text-sm font-semibold text-muted-foreground">
            {unit}
          </span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        aria-describedby={`${id}-hint`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer"
      />
      <div className="tabular mt-1 flex justify-between text-xs text-muted-foreground">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
      <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  )
}

export function StepProfile({
  request,
  quote,
  onProfileChange,
  onReset,
}: {
  request: BookingRequest
  quote: Quote
  onProfileChange: (patch: Partial<SliceProfile>) => void
  onReset: () => void
}) {
  const uc = USE_CASES[request.useCase]
  const venue = getVenue(request.venueId)
  const p = request.profile
  const isRecommended =
    p.throughputMbps === uc.recommended.throughputMbps &&
    p.maxLatencyMs === uc.recommended.maxLatencyMs &&
    p.reliability === uc.recommended.reliability

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-gray-mid bg-gray-light p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <Sparkles
              className="mt-0.5 size-5 shrink-0 text-brand-red"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold text-ink">
                {isRecommended ? "Recommended" : "Customized"} profile for{" "}
                {uc.label.toLowerCase()}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {uc.rationale}
              </p>
            </div>
          </div>
          {!isRecommended ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 hover:text-brand-red"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset to recommended
            </button>
          ) : null}
        </div>
      </div>

      <fieldset className="space-y-7">
        <legend className="text-xl font-bold text-ink">Slice guarantee</legend>
        <RangeField
          id="throughput"
          label="Guaranteed throughput"
          value={p.throughputMbps}
          unit="Mbps"
          {...PROFILE_LIMITS.throughputMbps}
          valueText={`${p.throughputMbps} megabits per second`}
          hint="Reserved downlink bandwidth for every device on the slice, combined."
          onChange={(v) => onProfileChange({ throughputMbps: v })}
        />
        <RangeField
          id="latency"
          label="Maximum latency"
          value={p.maxLatencyMs}
          unit="ms"
          {...PROFILE_LIMITS.maxLatencyMs}
          valueText={`${p.maxLatencyMs} milliseconds`}
          hint="Round-trip time we guarantee not to exceed. Lower costs more."
          onChange={(v) => onProfileChange({ maxLatencyMs: v })}
        />
        <div role="radiogroup" aria-labelledby="reliability-label">
          <p id="reliability-label" className="text-sm font-semibold text-ink">
            Reliability
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PROFILE_LIMITS.reliability.map((r: Reliability) => {
              const checked = p.reliability === r
              return (
                <label
                  key={r}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 px-3 py-2.5 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink",
                    checked
                      ? "border-ink bg-ink text-white"
                      : "border-gray-mid text-ink hover:border-gray-dark"
                  )}
                >
                  <input
                    type="radio"
                    name="reliability"
                    value={r}
                    checked={checked}
                    onChange={() => onProfileChange({ reliability: r })}
                    className="sr-only"
                  />
                  <span className="tabular block text-base font-bold">
                    {r}%
                  </span>
                  <span
                    className={cn(
                      "block text-xs",
                      checked ? "text-[#d8dada]" : "text-muted-foreground"
                    )}
                  >
                    {r === 99
                      ? "Best value"
                      : r === 99.9
                        ? "Standard"
                        : "Mission-critical"}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </fieldset>

      <div className="rounded-lg border border-gray-mid p-5">
        <CapacityBar
          quote={quote}
          venueName={venue.name}
          onFitThroughput={(mbps) => onProfileChange({ throughputMbps: mbps })}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Bookings are checked against every hour in your window. We keep{" "}
          {Math.round((1 - CAPACITY.maxReservable) * 100)}% of each site&apos;s
          slice capacity unreserved so the standard network keeps working.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: review
// ---------------------------------------------------------------------------

export function StepReview({
  request,
  quote,
}: {
  request: BookingRequest
  quote: Quote
}) {
  const venue = getVenue(request.venueId)
  const uc = USE_CASES[request.useCase]
  const rows: [string, string][] = [
    ["Location", venue.name],
    ["Date", formatDateLong(request.dateISO)],
    [
      "Time window",
      `${hourLabel(request.startHour)} to ${hourLabel(request.startHour + request.durationHours)} (${request.durationHours} h)`,
    ],
    ["Use case", uc.label],
    ["Guaranteed throughput", `${request.profile.throughputMbps} Mbps`],
    ["Maximum latency", `${request.profile.maxLatencyMs} ms`],
    ["Reliability", `${request.profile.reliability}%`],
    ["Total", formatUSD(quote.total)],
  ]
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Review your slice</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirm the details below. You can go back and change anything.
      </p>
      <dl className="mt-5 divide-y divide-gray-mid rounded-lg border border-gray-mid">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[1fr_1.4fr] gap-4 px-4 py-3 text-sm sm:px-5"
          >
            <dt className="text-muted-foreground">{k}</dt>
            <dd
              className={cn(
                "tabular text-right font-semibold text-ink",
                k === "Total" && "text-lg"
              )}
            >
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
        <li>· The slice activates 15 minutes before your start time.</li>
        <li>
          · If the guarantee is missed in any hour, that hour is credited
          automatically.
        </li>
        <li>· Free cancellation up to 2 hours before start.</li>
      </ul>
    </div>
  )
}
