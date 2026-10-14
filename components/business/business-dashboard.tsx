"use client"

import { CalendarRange, CircleDollarSign, Gauge, Ticket } from "lucide-react"
import { useMemo, useState } from "react"

import { ChartCard, ChartLegend } from "@/components/chart-card"
import { CHART_COLORS } from "@/components/charts/theme"
import { KpiCard } from "@/components/kpi-card"
import { DEFAULT_ASSUMPTIONS, type BusinessAssumptions } from "@/lib/config"
import { formatInt, formatPct, formatUSD, formatUSDCompact } from "@/lib/format"
import { projectBusiness } from "@/lib/simulate"
import { cn } from "@/lib/utils"

import { AssumptionsPanel } from "./assumptions-panel"
import { MonthlyChart, UseCaseDonut, UtilizationChart } from "./business-charts"

function MetricToggle({
  value,
  onChange,
}: {
  value: "revenue" | "bookings"
  onChange: (v: "revenue" | "bookings") => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Chart metric"
      className="inline-flex rounded-full border border-gray-mid p-0.5"
    >
      {(["revenue", "bookings"] as const).map((m) => (
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
  const [metric, setMetric] = useState<"revenue" | "bookings">("revenue")
  const p = useMemo(() => projectBusiness(assumptions), [assumptions])

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
            label="Projected annual revenue"
            value={formatUSDCompact(p.annualRevenue)}
            accent
            icon={<CircleDollarSign />}
            detail={`Year one · ${formatUSDCompact(p.steadyStateMonthlyRevenue)}/mo at full adoption`}
          />
          <KpiCard
            label="Avg utilization lift"
            value={`+${p.utilizationLiftPts.toFixed(1)}`}
            unit="pts"
            accent
            icon={<Gauge />}
            detail={`${formatPct(p.utilizationLiftPct, 1)} relative · +${p.nonPeakLiftPts.toFixed(1)} pts off-peak vs +${p.peakLiftPts.toFixed(1)} at peak`}
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
            detail={`Recovers ${formatUSD(p.upfrontCost)} up-front cost`}
          />
          <KpiCard
            label="Bookings, year one"
            value={formatInt(p.annualBookings)}
            icon={<Ticket />}
            detail={`${formatInt(assumptions.numberOfSites)} sites · ${formatInt(p.annualBookings * assumptions.hoursPerBooking)} slice-hours`}
          />
        </section>

        <ChartCard
          title={
            metric === "revenue"
              ? "Projected monthly revenue"
              : "Projected monthly bookings"
          }
          description="First 12 months after launch. Adoption ramps up from 25% of steady-state bookings."
          actions={<MetricToggle value={metric} onChange={setMetric} />}
          footer="Simulated projection from the assumptions panel. Hover a bar for revenue, bookings, and cumulative net."
        >
          <MonthlyChart months={p.months} metric={metric} />
        </ChartCard>

        <div className="grid gap-6 2xl:grid-cols-2">
          <ChartCard
            title="Revenue by use case"
            description="Booking mix weighted by each use case's typical slice price and duration."
          >
            <UseCaseDonut data={p.revenueByUseCase} />
          </ChartCard>
          <ChartCard
            title="Cell utilization, before vs. after"
            description="Average weekday load by hour. Off-peak pricing steers bookings into quieter hours."
            actions={
              <ChartLegend
                items={[
                  { label: "With SliceLive", color: CHART_COLORS.slice },
                  { label: "Before", color: CHART_COLORS.standard },
                ]}
              />
            }
          >
            <UtilizationChart data={p.utilization} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
