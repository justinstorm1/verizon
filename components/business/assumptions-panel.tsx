"use client"

import { SlidersHorizontal } from "lucide-react"

import {
  ASSUMPTION_LIMITS,
  BUSINESS,
  PLAN_ORDER,
  PLANS,
  PRESETS,
  type BusinessAssumptions,
} from "@/lib/config"
import { formatInt, formatPct, formatUSD } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Slider positions for log-scale fields (e.g. 1 to 100,000 sites) */
const LOG_STEPS = 1000

function toSlider(v: number, min: number, max: number) {
  return Math.round(
    (Math.log10(Math.max(min, v) / min) / Math.log10(max / min)) * LOG_STEPS
  )
}

function fromSlider(pos: number, min: number, max: number) {
  const raw = min * (max / min) ** (pos / LOG_STEPS)
  // Round to 2 significant figures above 100 so values stay readable
  if (raw < 100) return Math.round(raw)
  const mag = 10 ** (Math.floor(Math.log10(raw)) - 1)
  return Math.round(raw / mag) * mag
}

function sameAssumptions(a: BusinessAssumptions, b: BusinessAssumptions) {
  return (Object.keys(a) as (keyof BusinessAssumptions)[]).every(
    (k) => Math.abs(a[k] - b[k]) < 1e-9
  )
}

const FIELDS: {
  key: keyof BusinessAssumptions
  label: string
  prefix?: string
  suffix?: string
  /** Display multiplier for the number box (100 shows a 0-1 share as %) */
  scale?: number
  /** Use a logarithmic slider (for ranges spanning several orders of magnitude) */
  log?: boolean
  hint: string
}[] = [
  {
    key: "numberOfSites",
    label: "Number of sites",
    log: true,
    hint: "Cell sites selling Priority 5G. One site covers an area like a stadium or dorm block.",
  },
  {
    key: "signupsPerSitePerMonth",
    label: "Sign-ups wanted per site per month",
    hint: "Demand at full adoption, before seat limits. Month 1 starts lower.",
  },
  {
    key: "monthlyChurn",
    label: "Monthly churn",
    suffix: "%",
    scale: 100,
    hint: "Share of subscribers who cancel each month.",
  },
  {
    key: "upgradeRate",
    label: "Upgrade rate",
    suffix: "%",
    scale: 100,
    hint: "Share of subscribers paying for more speed or more time.",
  },
  {
    key: "guaranteedPoolCap",
    label: "Guaranteed pool cap",
    suffix: "%",
    scale: 100,
    hint: "Most of a cell guarantees may use. Higher means more seats, less room for regular users.",
  },
]

export function AssumptionsPanel({
  value,
  onChange,
}: {
  value: BusinessAssumptions
  onChange: (next: BusinessAssumptions) => void
}) {
  const activePreset = PRESETS.find((p) =>
    sameAssumptions(p.assumptions, value)
  )

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

      <fieldset className="border-b border-gray-mid p-5">
        <legend className="sr-only">Scenario presets</legend>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-ink" aria-hidden="true">
            Scenario
          </p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {activePreset ? activePreset.label : "Custom"}
          </p>
        </div>
        <div className="mt-3 grid gap-2">
          {PRESETS.map((p) => {
            const active = activePreset?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(p.assumptions)}
                className={cn(
                  "rounded-lg border-2 px-3 py-2 text-left transition-colors",
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-gray-mid bg-white text-ink hover:border-gray-dark"
                )}
              >
                <span className="block text-sm font-semibold">{p.label}</span>
                <span
                  className={cn(
                    "block text-xs",
                    active ? "text-gray-mid" : "text-muted-foreground"
                  )}
                >
                  {p.description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

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
                    className={cn(
                      "tabular h-8 bg-transparent px-2 text-right text-sm font-semibold text-ink outline-none",
                      f.log ? "w-24" : "w-16"
                    )}
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
                min={f.log ? 0 : lim.min}
                max={f.log ? LOG_STEPS : lim.max}
                step={f.log ? 1 : lim.step}
                value={
                  f.log
                    ? toSlider(value[f.key], lim.min, lim.max)
                    : value[f.key]
                }
                aria-describedby={`${id}-hint`}
                aria-valuetext={`${f.prefix ?? ""}${f.log ? formatInt(display) : display}${f.suffix ?? ""}`}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  onChange({
                    ...value,
                    [f.key]: f.log ? fromSlider(n, lim.min, lim.max) : n,
                  })
                }}
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
            ...PLAN_ORDER.map((id) => [
              PLANS[id].name,
              `${formatUSD(PLANS[id].price)} · ${formatPct(BUSINESS.signupMix[id])} of sign-ups`,
            ]),
            [
              "Upgrade spend",
              `${formatPct(BUSINESS.upgradeSpendShare)} of base price`,
            ],
            [
              "Adoption, month 1",
              `${formatPct(BUSINESS.adoptionStart)} of demand`,
            ],
            [
              "Avg site capacity",
              `${formatInt(BUSINESS.avgCellCapacityMbps)} Mbps`,
            ],
            ["Platform build (one-time)", formatUSD(BUSINESS.platformCost)],
            ["Onboarding per site", formatUSD(BUSINESS.perSiteCost)],
            [
              "Operating cost",
              `${formatPct(BUSINESS.operatingCostShare)} of revenue`,
            ],
            ["Trial to paid", formatPct(BUSINESS.funnel.trialToPaid)],
            [
              "Enterprise referrals",
              `${formatPct(BUSINESS.funnel.enterpriseReferralRate)} of orgs and businesses`,
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
