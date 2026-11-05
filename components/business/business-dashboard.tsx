"use client"

import { CalendarRange, CircleDollarSign, Repeat, Users } from "lucide-react"
import { useMemo, useState } from "react"

import { ChartCard, ChartLegend } from "@/components/chart-card"
import { CHART_COLORS } from "@/components/charts/theme"
import { KpiCard } from "@/components/kpi-card"
import {
  DEFAULT_ASSUMPTIONS,
  PLAN_ORDER,
  PLANS,
  type BusinessAssumptions,
} from "@/lib/config"
import {
  formatInt,
  formatPct,
  formatUSDCents,
  formatUSDCompact,
} from "@/lib/format"
import { projectBusiness } from "@/lib/simulate"
import { cn } from "@/lib/utils"

import { AssumptionsPanel } from "./assumptions-panel"
import {
  CapacityChart,
  FunnelChart,
  MonthlyChart,
  PLAN_COLORS,
  RevenueMixDonut,
} from "./business-charts"

type Metric = "revenue" | "subscribers"

function MetricToggle({
  value,
  onChange,
}: {
  value: Metric
  onChange: (v: Metric) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Chart metric"
      className="inline-flex rounded-full border border-gray-mid p-0.5"
    >
      {(["revenue", "subscribers"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={value === m}
          onClick={() => onChange(m)}
          className={cn(
            "rounded-full px-3.5 py-1 text-sm font-semibold capitalize transition-colors",
            value === m
              ? "bg-ink text-white"
              : "text-muted-foreground hover:text-ink"
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

export function BusinessDashboard() {
  const [assumptions, setAssumptions] =
    useState<BusinessAssumptions>(DEFAULT_ASSUMPTIONS)
  const [metric, setMetric] = useState<Metric>("revenue")
  const p = useMemo(() => projectBusiness(assumptions), [assumptions])
  const upgradeShare = p.revenueMix
    .filter((r) => r.id !== "base")
    .reduce((s, r) => s + r.share, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <AssumptionsPanel value={assumptions} onChange={setAssumptions} />
      </div>

      <div className="min-w-0 space-y-6">
        <section
          aria-label="Summary"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <KpiCard
            label="Year-one revenue"
            value={formatUSDCompact(p.yearOneRevenue)}
            accent
            icon={<CircleDollarSign />}
            detail={`${formatUSDCompact(p.exitArr)} annual run rate by month 12`}
          />
          <KpiCard
            label="Revenue per subscriber"
            value={formatUSDCents(p.arpu)}
            unit="/mo"
            accent
            icon={<Repeat />}
            detail={`${formatPct(upgradeShare)} of revenue from upgrades`}
          />
          <KpiCard
            label="Payback estimate"
            value={p.paybackMonths === null ? "n/a" : p.paybackMonths}
            unit={
              p.paybackMonths === null
                ? undefined
                : p.paybackMonths === 1
                  ? "month"
                  : "months"
            }
            icon={<CalendarRange />}
            detail={`Recovers ${formatUSDCompact(p.upfrontCost)} up-front cost`}
          />
          <KpiCard
            label="Subscribers at month 12"
            value={formatInt(p.subscribersAtExit)}
            icon={<Users />}
            detail={
              p.waitlistAtExit
                ? `${formatInt(p.waitlistAtExit)} turned away to the waitlist`
                : "No waitlist yet"
            }
          />
        </section>

        <ChartCard
          title={
            metric === "revenue"
              ? "Monthly recurring revenue by plan"
              : "Subscribers by plan"
          }
          description="First 12 months after launch. Sign-ups ramp up, then flatten once a plan's seats fill."
          actions={<MetricToggle value={metric} onChange={setMetric} />}
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <ChartLegend
                items={PLAN_ORDER.map((id) => ({
                  label: PLANS[id].name,
                  color: PLAN_COLORS[id],
                }))}
              />
              <span>Simulated projection from the assumptions panel.</span>
            </div>
          }
        >
          <MonthlyChart months={p.months} metric={metric} />
        </ChartCard>

        <div className="grid gap-6 2xl:grid-cols-2">
          <ChartCard
            title="Seats vs. demand at month 12"
            description="Seats are capped by each cell's guaranteed pool. Demand past the cap goes to a waitlist instead of diluting the guarantee."
            actions={
              <ChartLegend
                items={[
                  { label: "Subscribed", color: CHART_COLORS.slice },
                  { label: "Waitlisted", color: CHART_COLORS.standardLight },
                ]}
              />
            }
            footer="Simulated. Raise the pool cap to add seats, at the cost of less room for regular users."
          >
            <CapacityChart data={p.capacity} />
          </ChartCard>
          <ChartCard
            title="Where the revenue comes from"
            description="Base subscriptions vs. upgrades for more speed or more time."
            footer="Simulated. Upgrade spend and split are assumptions."
          >
            <RevenueMixDonut data={p.revenueMix} />
          </ChartCard>
        </div>

        <ChartCard
          title="Customer funnel: trial to enterprise lead"
          description="Subscribers who upgrade, and organizations and businesses that outgrow a plan, become leads for enterprise slicing."
          footer="Simulated from the funnel assumptions."
        >
          <FunnelChart data={p.funnel} />
        </ChartCard>
      </div>
    </div>
  )
}
