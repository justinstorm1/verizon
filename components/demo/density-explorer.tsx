"use client"

import { useState } from "react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartCard, ChartLegend } from "@/components/chart-card"
import { ChartTooltip } from "@/components/charts/chart-tooltip"
import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  CHART_COLORS,
} from "@/components/charts/theme"
import { CAPACITY, DEMO, DENSITY } from "@/lib/config"
import { densityCurve, densityPoint, type DensityPoint } from "@/lib/simulate"
import { cn } from "@/lib/utils"

const CAP = CAPACITY.guaranteedPoolCap * 100

/**
 * "If everyone subscribes, isn't it just normal 5G?" Shows priority and
 * regular latency during a surge as the subscribed share grows, with and
 * without admission control.
 */
export function DensityExplorer() {
  const [share, setShare] = useState(DENSITY.defaultSubscribedShare)
  const [control, setControl] = useState(true)
  const curve = densityCurve(control)
  const now = densityPoint(share, control)
  const waitlisted = Math.max(0, now.subscribed - now.admitted)
  const met = now.priorityLatency <= DEMO.slice.guaranteeLatencyMs

  return (
    <ChartCard
      title="What if everyone subscribes?"
      description="Latency during a surge as more devices on one cell subscribe. Turn admission control off to see what happens without limits."
      actions={
        <ChartLegend
          items={[
            { label: "Subscribers on priority", color: CHART_COLORS.slice },
            { label: "Regular network", color: CHART_COLORS.standard },
            { label: "Boost guarantee", color: CHART_COLORS.ink, dashed: true },
          ]}
        />
      }
      footer="Simulated network. Illustrative values. Priority latency rises with the load that is prioritized; regular traffic slows as more load goes ahead of it."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div
          className="h-[300px] w-full"
          role="img"
          aria-label={`Line chart of latency versus share of devices subscribed. At ${Math.round(now.subscribed)}% subscribed with admission control ${control ? "on" : "off"}, priority latency is ${Math.round(now.priorityLatency)} ms and regular latency is ${Math.round(now.standardLatency)} ms.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={curve}
              margin={{ top: 8, right: 12, bottom: 20, left: 4 }}
            >
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              {control ? (
                <ReferenceArea
                  x1={CAP}
                  x2={100}
                  fill={CHART_COLORS.ink}
                  fillOpacity={0.04}
                  label={{
                    value: "Beyond the cap: waitlist",
                    position: "insideTopRight",
                    fill: CHART_COLORS.axis,
                    fontSize: 11,
                  }}
                />
              ) : null}
              <XAxis
                dataKey="subscribed"
                type="number"
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.standardLight }}
                tickFormatter={(v: number) => `${v}%`}
                label={{
                  value: "Devices on this cell that subscribe (%)",
                  position: "insideBottom",
                  offset: -12,
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <YAxis
                domain={[0, 240]}
                ticks={[0, 60, 120, 180, 240]}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={52}
                label={{
                  value: "Latency (ms)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { ...AXIS_LABEL_STYLE, textAnchor: "middle" },
                }}
              />
              <ReferenceLine
                y={DEMO.slice.guaranteeLatencyMs}
                stroke={CHART_COLORS.ink}
                strokeDasharray="5 4"
                label={{
                  value: `Guarantee ≤${DEMO.slice.guaranteeLatencyMs} ms`,
                  position: "insideBottomLeft",
                  fill: CHART_COLORS.ink,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                x={now.subscribed}
                stroke={CHART_COLORS.ink}
                strokeWidth={1.5}
              />
              <Tooltip
                cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = payload?.[0]?.payload as DensityPoint | undefined
                  if (!active || !p) return null
                  return (
                    <ChartTooltip
                      title={`${Math.round(p.subscribed)}% subscribed`}
                      rows={[
                        {
                          label: "Subscribers on priority",
                          value: `${Math.round(p.priorityLatency)} ms`,
                          color: CHART_COLORS.slice,
                          emphasis: true,
                        },
                        {
                          label: "Regular network",
                          value: `${Math.round(p.standardLatency)} ms`,
                          color: CHART_COLORS.standard,
                        },
                        {
                          label: "Admitted to priority",
                          value: `${Math.round(p.admitted)}%`,
                        },
                      ]}
                    />
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="standardLatency"
                name="Regular network"
                stroke={CHART_COLORS.standard}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
              <Line
                type="monotone"
                dataKey="priorityLatency"
                name="Subscribers on priority"
                stroke={CHART_COLORS.slice}
                strokeWidth={2.5}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="density-share"
                className="text-sm font-semibold text-ink"
              >
                Devices that subscribe
              </label>
              <span className="tabular text-2xl font-extrabold text-ink">
                {Math.round(share * 100)}%
              </span>
            </div>
            <input
              id="density-share"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={share}
              aria-valuetext={`${Math.round(share * 100)} percent of devices subscribed`}
              onChange={(e) => setShare(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span id="control-label" className="text-sm font-semibold text-ink">
              Admission control
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={control}
              aria-labelledby="control-label"
              onClick={() => setControl((c) => !c)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
                control ? "bg-ink" : "bg-gray-mid"
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-white shadow transition-transform",
                  control ? "translate-x-6" : "translate-x-1"
                )}
              />
              <span className="sr-only">{control ? "On" : "Off"}</span>
            </button>
          </div>

          <dl className="tabular grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid">
            {[
              ["Priority latency", `${Math.round(now.priorityLatency)} ms`],
              ["Regular latency", `${Math.round(now.standardLatency)} ms`],
              ["On priority", `${Math.round(now.admitted)}%`],
              ["Waitlisted", `${Math.round(waitlisted)}%`],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 text-lg font-extrabold text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <p
            role="status"
            className={cn(
              "rounded-lg border p-3 text-sm",
              met
                ? "border-success/30 bg-success-tint text-success"
                : "border-danger/30 bg-danger-tint text-danger"
            )}
          >
            {met
              ? control && waitlisted > 0
                ? `Guarantee holds. Only ${Math.round(CAP)}% can be on priority at once; the rest wait for a seat.`
                : "Guarantee holds. Priority is still a small share of the cell."
              : "Guarantee broken. With no cap, so much traffic is prioritized that priority becomes just another crowded network."}
          </p>
        </div>
      </div>
    </ChartCard>
  )
}
