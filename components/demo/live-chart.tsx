"use client"

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

import { ChartTooltip } from "@/components/charts/chart-tooltip"
import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  CHART_COLORS,
} from "@/components/charts/theme"
import { DEMO } from "@/lib/config"
import type { NetworkSample } from "@/lib/simulate"

type MetricKey = keyof Pick<
  NetworkSample,
  "standardLatency" | "sliceLatency" | "standardThroughput" | "sliceThroughput"
>

export interface LiveChartProps {
  samples: NetworkSample[]
  standardKey: MetricKey
  sliceKey: MetricKey
  unit: string
  yLabel: string
  yDomain: [number, number]
  /** Label sits above the line ("above") or below it ("below"), at the left edge */
  guarantee: { value: number; label: string; labelSide: "above" | "below" }
  surgeWindow: { start: number; end: number | null } | null
  /** Accessible summary of what the chart shows right now */
  summary: string
}

const WINDOW = DEMO.windowSeconds

export function LiveChart({
  samples,
  standardKey,
  sliceKey,
  unit,
  yLabel,
  yDomain,
  guarantee,
  surgeWindow,
  summary,
}: LiveChartProps) {
  const tMax = samples.length ? samples[samples.length - 1].t : WINDOW
  const tMin = tMax - WINDOW
  const ticks = Array.from({ length: 7 }, (_, i) => tMax - WINDOW + i * 10)
  const surgeEnd = surgeWindow ? (surgeWindow.end ?? tMax) : null

  return (
    <figure className="m-0">
      <div
        className="h-[260px] w-full sm:h-[300px]"
        role="img"
        aria-label={summary}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={samples}
            margin={{ top: 8, right: 12, bottom: 20, left: 4 }}
          >
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            {surgeWindow && surgeEnd !== null && surgeEnd > tMin ? (
              <ReferenceArea
                x1={Math.max(surgeWindow.start, tMin)}
                x2={surgeEnd}
                fill={CHART_COLORS.ink}
                fillOpacity={0.035}
                ifOverflow="hidden"
                label={{
                  value: "Crowd surge",
                  position: "insideTopLeft",
                  fill: CHART_COLORS.axis,
                  fontSize: 11,
                }}
              />
            ) : null}
            <XAxis
              dataKey="t"
              type="number"
              domain={[tMin, tMax]}
              ticks={ticks}
              allowDataOverflow
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.standardLight }}
              tickFormatter={(v: number) =>
                Math.abs(v - tMax) < 0.01 ? "now" : `${Math.round(v - tMax)}s`
              }
              label={{
                value: "Time (seconds before now)",
                position: "insideBottom",
                offset: -12,
                style: AXIS_LABEL_STYLE,
              }}
            />
            <YAxis
              domain={yDomain}
              allowDataOverflow
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={52}
              label={{
                value: yLabel,
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { ...AXIS_LABEL_STYLE, textAnchor: "middle" },
              }}
            />
            <ReferenceLine
              y={guarantee.value}
              stroke={CHART_COLORS.ink}
              strokeDasharray="5 4"
              strokeWidth={1}
              ifOverflow="extendDomain"
              label={{
                value: guarantee.label,
                // Horizontal line: "insideBottom*" renders above it, "insideTop*" below
                position:
                  guarantee.labelSide === "above"
                    ? "insideBottomLeft"
                    : "insideTopLeft",
                fill: CHART_COLORS.ink,
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as NetworkSample | undefined
                if (!active || !p) return null
                return (
                  <ChartTooltip
                    title={`${Math.round(p.t - tMax)}s · load ${Math.round(p.load * 100)}%`}
                    rows={[
                      {
                        label: "Sliced connection",
                        value: `${p[sliceKey].toFixed(0)} ${unit}`,
                        color: CHART_COLORS.slice,
                        emphasis: true,
                      },
                      {
                        label: "Standard network",
                        value: `${p[standardKey].toFixed(0)} ${unit}`,
                        color: CHART_COLORS.standard,
                      },
                    ]}
                  />
                )
              }}
            />
            <Line
              type="monotone"
              dataKey={standardKey}
              name="Standard network"
              stroke={CHART_COLORS.standard}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey={sliceKey}
              name="Sliced connection"
              stroke={CHART_COLORS.slice}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
