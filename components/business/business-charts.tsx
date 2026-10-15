"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceArea,
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
import { PRICING } from "@/lib/config"
import { formatInt, formatPct, formatUSD, formatUSDCompact } from "@/lib/format"
import type {
  FunnelStage,
  MonthProjection,
  UseCaseRevenue,
  UtilizationPoint,
} from "@/lib/simulate"

// ---------------------------------------------------------------------------
// Monthly revenue or bookings
// ---------------------------------------------------------------------------

export function MonthlyChart({
  months,
  metric,
}: {
  months: MonthProjection[]
  metric: "revenue" | "bookings"
}) {
  const isRevenue = metric === "revenue"
  const first = months[0]
  const last = months[months.length - 1]
  const summary = isRevenue
    ? `Bar chart of projected monthly revenue over 12 months, rising from ${formatUSD(first.revenue)} in month 1 to ${formatUSD(last.revenue)} in month 12.`
    : `Bar chart of projected monthly bookings over 12 months, rising from ${formatInt(first.bookings)} in month 1 to ${formatInt(last.bookings)} in month 12.`

  return (
    <div className="h-[300px] w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={months}
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
              isRevenue ? formatUSDCompact(v) : formatInt(v)
            }
            label={{
              value: isRevenue ? "Revenue (USD)" : "Bookings",
              angle: -90,
              position: "insideLeft",
              offset: 0,
              style: { ...AXIS_LABEL_STYLE, textAnchor: "middle" },
            }}
          />
          <Tooltip
            cursor={{ fill: CHART_COLORS.ink, fillOpacity: 0.04 }}
            content={({ active, payload }) => {
              const m = payload?.[0]?.payload as MonthProjection | undefined
              if (!active || !m) return null
              return (
                <ChartTooltip
                  title={`Month ${m.month}`}
                  rows={[
                    {
                      label: "Revenue",
                      value: formatUSD(m.revenue),
                      color: isRevenue ? CHART_COLORS.slice : undefined,
                      emphasis: isRevenue,
                    },
                    {
                      label: "Bookings",
                      value: formatInt(m.bookings),
                      color: isRevenue ? undefined : CHART_COLORS.slice,
                      emphasis: !isRevenue,
                    },
                    {
                      label: "Cumulative net",
                      value: formatUSD(m.cumulativeNet),
                    },
                  ]}
                />
              )
            }}
          />
          <Bar
            dataKey={metric}
            name={isRevenue ? "Revenue" : "Bookings"}
            fill={CHART_COLORS.slice}
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
            animationDuration={400}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Revenue by use case (donut)
// ---------------------------------------------------------------------------

export function UseCaseDonut({ data }: { data: UseCaseRevenue[] }) {
  const summary = `Donut chart of year-one revenue by use case: ${data
    .map((d) => `${d.label} ${formatPct(d.share)}`)
    .join(", ")}.`

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div
        className="relative mx-auto h-[220px] w-full max-w-[220px]"
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
                <Cell
                  key={d.id}
                  fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as UseCaseRevenue | undefined
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
      <ul className="space-y-3" aria-label="Revenue by use case">
        {data.map((d, i) => (
          <li key={d.id} className="flex items-center gap-3">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{
                backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
              }}
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
// Utilization before vs. after
// ---------------------------------------------------------------------------

export function UtilizationChart({ data }: { data: UtilizationPoint[] }) {
  const [peakStart, peakEnd] = PRICING.peakHours
  const summary = `Area chart of average cell utilization by hour of day, before and after SliceLive. Bookings fill daytime and late-evening hours more than the evening peak.`

  return (
    <div className="h-[300px] w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 20, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <ReferenceArea
            x1={peakStart}
            x2={peakEnd - 1}
            fill={CHART_COLORS.ink}
            fillOpacity={0.04}
            label={{
              value: "Peak pricing",
              position: "insideTop",
              fill: CHART_COLORS.axis,
              fontSize: 11,
            }}
          />
          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, 23]}
            ticks={[0, 4, 8, 12, 16, 20, 23]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.standardLight }}
            tickFormatter={(h: number) => data[h]?.label ?? ""}
            label={{
              value: "Hour of day",
              position: "insideBottom",
              offset: -12,
              style: AXIS_LABEL_STYLE,
            }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => `${v}%`}
            label={{
              value: "Cell utilization (%)",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              style: { ...AXIS_LABEL_STYLE, textAnchor: "middle" },
            }}
          />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as UtilizationPoint | undefined
              if (!active || !p) return null
              return (
                <ChartTooltip
                  title={p.label}
                  rows={[
                    {
                      label: "With SliceLive",
                      value: `${p.after.toFixed(1)}%`,
                      color: CHART_COLORS.slice,
                      emphasis: true,
                    },
                    {
                      label: "Before",
                      value: `${p.before.toFixed(1)}%`,
                      color: CHART_COLORS.standard,
                    },
                    {
                      label: "Lift",
                      value: `+${(p.after - p.before).toFixed(1)} pts`,
                    },
                  ]}
                />
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="after"
            name="With SliceLive"
            stroke={CHART_COLORS.slice}
            strokeWidth={2}
            fill={CHART_COLORS.slice}
            fillOpacity={0.1}
            animationDuration={400}
            activeDot={{ r: 4, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="before"
            name="Before"
            stroke={CHART_COLORS.standard}
            strokeWidth={2}
            fill={CHART_COLORS.standardLight}
            fillOpacity={0.6}
            animationDuration={400}
            activeDot={{ r: 4, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Customer funnel: first booking to enterprise upgrade
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
            tickFormatter={(v: number) => formatInt(v)}
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
