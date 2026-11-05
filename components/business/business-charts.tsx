"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartTooltip } from "@/components/charts/chart-tooltip"
import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  CATEGORY_COLORS,
  CHART_COLORS,
} from "@/components/charts/theme"
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/config"
import {
  formatInt,
  formatIntCompact,
  formatPct,
  formatUSD,
  formatUSDCompact,
} from "@/lib/format"
import type {
  BusinessProjection,
  FunnelStage,
  MonthProjection,
  SegmentCapacity,
} from "@/lib/simulate"

/** Fixed color per plan, in categorical order (never reassigned by rank) */
export const PLAN_COLORS: Record<PlanId, string> = {
  individual: CATEGORY_COLORS[0],
  family: CATEGORY_COLORS[1],
  "small-business": CATEGORY_COLORS[2],
  organization: CATEGORY_COLORS[4],
}

// ---------------------------------------------------------------------------
// Monthly recurring revenue or subscribers, stacked by plan
// ---------------------------------------------------------------------------

export function MonthlyChart({
  months,
  metric,
}: {
  months: MonthProjection[]
  metric: "revenue" | "subscribers"
}) {
  const isRevenue = metric === "revenue"
  const data = months.map((m) => ({
    label: m.label,
    month: m.month,
    total: isRevenue ? m.totalRevenue : m.totalSubscribers,
    ...Object.fromEntries(
      PLAN_ORDER.map((id) => [
        id,
        isRevenue ? m.revenue[id] : m.subscribers[id],
      ])
    ),
  }))
  const fmt = (v: number) => (isRevenue ? formatUSD(v) : formatInt(v))
  const first = months[0]
  const last = months[months.length - 1]
  const summary = isRevenue
    ? `Stacked bar chart of monthly recurring revenue by plan, from ${formatUSD(first.totalRevenue)} in month 1 to ${formatUSD(last.totalRevenue)} in month 12.`
    : `Stacked bar chart of subscribers by plan, from ${formatInt(first.totalSubscribers)} in month 1 to ${formatInt(last.totalSubscribers)} in month 12.`

  return (
    <div className="h-[300px] w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 20, left: 8 }}
          barCategoryGap="22%"
        >
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.standardLight }}
            label={{
              value: "Month after launch",
              position: "insideBottom",
              offset: -12,
              style: AXIS_LABEL_STYLE,
            }}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) =>
              isRevenue ? formatUSDCompact(v) : formatIntCompact(v)
            }
            label={{
              value: isRevenue ? "Monthly revenue (USD)" : "Subscribers",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { ...AXIS_LABEL_STYLE, textAnchor: "middle" },
            }}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.ink, fillOpacity: 0.04 }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as
                | (Record<string, number> & { month: number; total: number })
                | undefined
              if (!active || !d) return null
              return (
                <ChartTooltip
                  title={`Month ${d.month}`}
                  rows={[
                    ...[...PLAN_ORDER].reverse().map((id) => ({
                      label: PLANS[id].name,
                      value: fmt(d[id]),
                      color: PLAN_COLORS[id],
                    })),
                    { label: "Total", value: fmt(d.total), emphasis: true },
                  ]}
                />
              )
            }}
          />
          {PLAN_ORDER.map((id, i) => (
            <Bar
              key={id}
              dataKey={id}
              name={PLANS[id].name}
              stackId="plans"
              fill={PLAN_COLORS[id]}
              stroke={CHART_COLORS.surface}
              strokeWidth={1}
              radius={i === PLAN_ORDER.length - 1 ? [4, 4, 0, 0] : 0}
              maxBarSize={44}
              animationDuration={400}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Revenue mix: base subscriptions vs. upgrades (donut)
// ---------------------------------------------------------------------------

const MIX_COLORS = [CHART_COLORS.ink, CHART_COLORS.slice, CHART_COLORS.standard]

export function RevenueMixDonut({
  data,
}: {
  data: BusinessProjection["revenueMix"]
}) {
  const summary = `Donut chart of year-one revenue: ${data
    .map((d) => `${d.label} ${formatPct(d.share)}`)
    .join(", ")}.`
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,200px)_1fr]">
      <div
        className="relative mx-auto h-[200px] w-full max-w-[200px]"
        role="img"
        aria-label={summary}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={1.5}
              stroke={CHART_COLORS.surface}
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              animationDuration={400}
            >
              {data.map((d, i) => (
                <Cell key={d.id} fill={MIX_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as
                  (typeof data)[number] | undefined
                if (!active || !d) return null
                return (
                  <ChartTooltip
                    title={d.label}
                    rows={[
                      {
                        label: "Revenue",
                        value: formatUSD(d.value),
                        emphasis: true,
                      },
                      { label: "Share", value: formatPct(d.share, 1) },
                    ]}
                  />
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-muted-foreground">Year one</span>
          <span className="tabular text-xl font-extrabold text-ink">
            {formatUSDCompact(data.reduce((s, d) => s + d.value, 0))}
          </span>
        </div>
      </div>
      {/* Direct labels double as the legend and a table view */}
      <ul className="space-y-3" aria-label="Revenue mix">
        {data.map((d, i) => (
          <li key={d.id} className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: MIX_COLORS[i] }}
              aria-hidden="true"
            />
            <span className="flex-1 text-sm text-ink">{d.label}</span>
            <span className="tabular text-sm font-bold text-ink">
              {formatPct(d.share)}
            </span>
            <span className="tabular w-16 text-right text-sm text-muted-foreground">
              {formatUSDCompact(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Seats vs. demand: subscribers admitted and waitlisted, by plan
// ---------------------------------------------------------------------------

export function CapacityChart({ data }: { data: SegmentCapacity[] }) {
  const summary = `Stacked bar chart of subscribers and waitlist at month 12 by plan: ${data
    .map(
      (d) =>
        `${d.label} ${formatInt(d.subscribers)} subscribed of ${formatInt(d.seats)} seats, ${formatInt(d.waitlist)} waitlisted`
    )
    .join("; ")}.`
  return (
    <div className="h-[280px] w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 20, left: 8 }}
          barCategoryGap="30%"
        >
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="label"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.standardLight }}
            label={{
              value: "Plan",
              position: "insideBottom",
              offset: -12,
              style: AXIS_LABEL_STYLE,
            }}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => formatIntCompact(v)}
            label={{
              value: "Customers",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { ...AXIS_LABEL_STYLE, textAnchor: "middle" },
            }}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.ink, fillOpacity: 0.04 }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as SegmentCapacity | undefined
              if (!active || !d) return null
              return (
                <ChartTooltip
                  title={d.label}
                  rows={[
                    {
                      label: "Subscribed",
                      value: formatInt(d.subscribers),
                      color: CHART_COLORS.slice,
                      emphasis: true,
                    },
                    {
                      label: "Waitlisted",
                      value: formatInt(d.waitlist),
                      color: CHART_COLORS.standardLight,
                    },
                    { label: "Seats (all sites)", value: formatInt(d.seats) },
                  ]}
                />
              )
            }}
          />
          <Bar
            dataKey="subscribers"
            name="Subscribed"
            stackId="c"
            fill={CHART_COLORS.slice}
            stroke={CHART_COLORS.surface}
            strokeWidth={1}
            maxBarSize={64}
            animationDuration={400}
          />
          <Bar
            dataKey="waitlist"
            name="Waitlisted"
            stackId="c"
            fill={CHART_COLORS.standardLight}
            stroke={CHART_COLORS.surface}
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
            maxBarSize={64}
            animationDuration={400}
          >
            <LabelList
              dataKey="waitlist"
              position="top"
              formatter={(v) =>
                Number(v) > 0 ? `+${formatInt(Number(v))} waiting` : ""
              }
              style={{ fill: CHART_COLORS.ink, fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Customer funnel: trial to enterprise lead
// ---------------------------------------------------------------------------

export function FunnelChart({ data }: { data: FunnelStage[] }) {
  const summary = `Horizontal bar chart of the simulated customer funnel: ${data
    .map((d) => `${d.stage} ${formatInt(d.customers)}`)
    .join(", ")} customers per year.`

  return (
    <div className="h-[260px] w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 56, bottom: 20, left: 8 }}
          barCategoryGap="24%"
        >
          <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
          <XAxis
            type="number"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.standardLight }}
            tickFormatter={(v: number) => formatIntCompact(v)}
            label={{
              value: "Customers per year",
              position: "insideBottom",
              offset: -12,
              style: AXIS_LABEL_STYLE,
            }}
          />
          <YAxis
            type="category"
            dataKey="stage"
            tick={{ ...AXIS_TICK, fill: CHART_COLORS.ink }}
            tickLine={false}
            axisLine={false}
            width={150}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.ink, fillOpacity: 0.04 }}
            content={({ active, payload }) => {
              const d = payload?.[0]?.payload as FunnelStage | undefined
              if (!active || !d) return null
              const i = data.findIndex((x) => x.stage === d.stage)
              const prev = i > 0 ? data[i - 1].customers : null
              return (
                <ChartTooltip
                  title={d.stage}
                  rows={[
                    {
                      label: "Customers",
                      value: formatInt(d.customers),
                      emphasis: true,
                    },
                    ...(prev
                      ? [
                          {
                            label: "From previous stage",
                            value: formatPct(d.customers / prev),
                          },
                        ]
                      : []),
                    { label: "Meaning", value: d.description },
                  ]}
                />
              )
            }}
          />
          <Bar
            dataKey="customers"
            name="Customers"
            radius={[0, 4, 4, 0]}
            maxBarSize={32}
            animationDuration={400}
          >
            {data.map((d, i) => (
              <Cell
                key={d.stage}
                fill={
                  i === data.length - 1 ? CHART_COLORS.slice : CHART_COLORS.ink
                }
              />
            ))}
            <LabelList
              dataKey="customers"
              position="right"
              formatter={(v) => formatInt(Number(v))}
              style={{ fill: CHART_COLORS.ink, fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
