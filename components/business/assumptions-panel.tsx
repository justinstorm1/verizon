"use client"

import { RotateCcw, SlidersHorizontal } from "lucide-react"

import {
  ASSUMPTION_LIMITS,
  BUSINESS,
  DEFAULT_ASSUMPTIONS,
  type BusinessAssumptions,
} from "@/lib/config"
import { formatPct, formatUSD } from "@/lib/format"

const FIELDS: {
  key: keyof BusinessAssumptions
  label: string
  prefix?: string
  suffix?: string
  /** Display multiplier for the number box (100 shows a 0-1 share as %) */
  scale?: number
  hint: string
}[] = [
  {
    key: "pricePerHour",
    label: "Price per slice-hour",
    prefix: "$",
    hint: "Average price at standard rates, before off-peak discounts.",
  },
  {
    key: "bookingsPerSitePerMonth",
    label: "Bookings per site per month",
    hint: "At full adoption. Month 1 starts lower.",
  },
  {
    key: "hoursPerBooking",
    label: "Hours per booking",
    suffix: "h",
    hint: "Typical event length across use cases.",
  },
  {
    key: "numberOfSites",
    label: "Number of sites",
    hint: "Campus and venue cell sites offering slices.",
  },
  {
    key: "offPeakShare",
    label: "Off-peak share",
    suffix: "%",
    scale: 100,
    hint: "Share of booked hours outside 4–10 PM. Discounted, but attracts extra bookings.",
  },
]

export function AssumptionsPanel({
  value,
  onChange,
}: {
  value: BusinessAssumptions
  onChange: (next: BusinessAssumptions) => void
}) {
  const isDefault = (
    Object.keys(DEFAULT_ASSUMPTIONS) as (keyof BusinessAssumptions)[]
  ).every((k) => value[k] === DEFAULT_ASSUMPTIONS[k])

  return (
    <section
      aria-labelledby="assumptions-heading"
      className="rounded-lg border border-gray-mid bg-white shadow-card"
    >
      <div className="flex items-center justify-between border-b border-gray-mid p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-ink" aria-hidden="true" />
          <h2 id="assumptions-heading" className="text-base font-bold text-ink">
            Assumptions
          </h2>
        </div>
        <span className="rounded-sm bg-gray-light px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Simulated
        </span>
      </div>

      <div className="space-y-6 p-5">
        {FIELDS.map((f) => {
          const lim = ASSUMPTION_LIMITS[f.key]
          const id = `assume-${f.key}`
          const scale = f.scale ?? 1
          const display = Math.round(value[f.key] * scale * 100) / 100
          return (
            <div key={f.key}>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={id} className="text-sm font-semibold text-ink">
                  <span className="block text-[10px] font-bold tracking-wide text-brand-red uppercase">
                    Assumption
                  </span>
                  {f.label}
                </label>
                <div className="flex items-center rounded-md border border-gray-mid focus-within:border-ink">
                  {f.prefix ? (
                    <span className="pl-2 text-sm text-muted-foreground">
                      {f.prefix}
                    </span>
                  ) : null}
                  <input
                    type="number"
                    inputMode="decimal"
                    aria-label={`${f.label} (assumption), exact value`}
                    className="tabular h-8 w-16 bg-transparent px-2 text-right text-sm font-semibold text-ink outline-none"
                    min={lim.min * scale}
                    max={lim.max * scale}
                    step={lim.step * scale}
                    value={display}
                    // Accept free typing; clamp to the allowed range on blur
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (
                        e.target.value !== "" &&
                        Number.isFinite(n) &&
                        n >= 0
                      ) {
                        onChange({ ...value, [f.key]: n / scale })
                      }
                    }}
                    onBlur={() =>
                      onChange({
                        ...value,
                        [f.key]: Math.min(
                          lim.max,
                          Math.max(lim.min, value[f.key])
                        ),
                      })
                    }
                  />
                  {f.suffix ? (
                    <span className="pr-2 text-sm text-muted-foreground">
                      {f.suffix}
                    </span>
                  ) : null}
                </div>
              </div>
              <input
                id={id}
                type="range"
                className="mt-2 w-full cursor-pointer"
                min={lim.min}
                max={lim.max}
                step={lim.step}
                value={value[f.key]}
                aria-describedby={`${id}-hint`}
                aria-valuetext={`${f.prefix ?? ""}${display}${f.suffix ?? ""}`}
                onChange={(e) =>
                  onChange({ ...value, [f.key]: Number(e.target.value) })
                }
              />
              <p
                id={`${id}-hint`}
                className="mt-0.5 text-xs text-muted-foreground"
              >
                {f.hint}
              </p>
            </div>
          )
        })}

        {!isDefault ? (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_ASSUMPTIONS)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 hover:text-brand-red"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset to defaults
          </button>
        ) : null}
      </div>

      <div className="border-t border-gray-mid bg-gray-light p-5">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Fixed assumptions
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Every value here is an assumption, not data.
        </p>
        <dl className="tabular mt-3 space-y-1.5 text-xs">
          {[
            ["Platform build (one-time)", formatUSD(BUSINESS.platformCost)],
            ["Onboarding per site", formatUSD(BUSINESS.perSiteCost)],
            [
              "Operating cost",
              `${formatPct(BUSINESS.operatingCostShare)} of revenue`,
            ],
            [
              "Adoption, month 1",
              `${formatPct(BUSINESS.adoptionStart)} of steady state`,
            ],
            [
              "Avg slice size",
              `${formatPct(BUSINESS.avgSliceCapacityShare)} of site capacity`,
            ],
            ["Off-peak discount", formatPct(BUSINESS.offPeakDiscount)],
            [
              "Off-peak demand uplift",
              `+${formatPct(BUSINESS.offPeakDemandUplift)} × off-peak share`,
            ],
            [
              "Bookings per customer",
              `${BUSINESS.funnel.bookingsPerCustomer} per year`,
            ],
            [
              "Funnel conversion",
              `${formatPct(BUSINESS.funnel.repeatRate)} → ${formatPct(BUSINESS.funnel.recurringRate)} → ${formatPct(BUSINESS.funnel.enterpriseUpgradeRate)}`,
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Edit in <code className="font-mono">lib/config.ts</code>.
        </p>
      </div>
    </section>
  )
}
