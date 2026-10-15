"use client"

import {
  Activity,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  TimerReset,
  Users,
  Waves,
} from "lucide-react"

import { ChartCard, ChartLegend } from "@/components/chart-card"
import { CHART_COLORS } from "@/components/charts/theme"
import { KpiCard } from "@/components/kpi-card"
import { SliceBadge } from "@/components/slice-badge"
import { Button } from "@/components/ui/button"
import { useSurgeSimulation } from "@/hooks/use-surge-simulation"
import { DEMO, USE_CASES } from "@/lib/config"
import { formatInt } from "@/lib/format"
import {
  SURGE_TOTAL_SECONDS,
  meetsGuarantee,
  uptime,
  type DemoState,
  type SurgePhase,
} from "@/lib/simulate"
import { cn } from "@/lib/utils"

import { LiveChart } from "./live-chart"

const PHASE_LABEL: Record<SurgePhase, string> = {
  idle: "Normal traffic",
  ramping: "Crowd arriving",
  peak: "Peak crowd",
  recovering: "Crowd dispersing",
  complete: "Surge complete",
}

const LEGEND = [
  { label: "Sliced connection", color: CHART_COLORS.slice },
  { label: "Standard network", color: CHART_COLORS.standard },
  { label: "Slice guarantee", color: CHART_COLORS.ink, dashed: true },
]

export function DemoDashboard() {
  const { state, paused, start, reset, togglePause } = useSurgeSimulation()
  const latest = state.samples[state.samples.length - 1]
  const surging =
    state.phase === "ramping" ||
    state.phase === "peak" ||
    state.phase === "recovering"
  const elapsed =
    state.surgeWindow && surging ? latest.t - state.surgeWindow.start : 0
  const up = uptime(state.samples)
  const sliceMet = meetsGuarantee(latest.sliceLatency, latest.sliceThroughput)
  const standardMet = meetsGuarantee(
    latest.standardLatency,
    latest.standardThroughput
  )
  const latencyRatio = latest.standardLatency / latest.sliceLatency

  return (
    <div className="space-y-6">
      {/* Controls */}
      <section
        aria-label="Simulation controls"
        className="flex flex-col gap-5 rounded-lg border border-gray-mid bg-white p-5 shadow-card lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={start} disabled={surging}>
            <Play className="fill-current" />
            {surging
              ? `Surge in progress · ${Math.round(elapsed)}s`
              : state.phase === "complete"
                ? "Run surge again"
                : "Start crowd surge"}
          </Button>
          <Button variant="outline" onClick={togglePause} aria-pressed={paused}>
            {paused ? <Play /> : <Pause />}
            {paused ? "Resume" : "Pause"}
          </Button>
          <Button variant="ghost" onClick={reset}>
            <RotateCcw />
            Reset
          </Button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-md">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span
              className="flex items-center gap-2 font-semibold text-ink"
              role="status"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  surging ? "animate-pulse bg-brand-red" : "bg-gray-dark"
                )}
                aria-hidden="true"
              />
              {PHASE_LABEL[state.phase]}
              {paused ? " (paused)" : ""}
            </span>
            <span className="tabular flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-4" aria-hidden="true" />
              {formatInt(latest.devices)} devices on cell
            </span>
          </div>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-gray-light"
            role="meter"
            aria-label="Cell load"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(latest.load * 100)}
          >
            <div
              className="h-full rounded-full bg-ink transition-[width] duration-500 ease-out"
              style={{ width: `${latest.load * 100}%` }}
            />
          </div>
          <p className="tabular text-xs text-muted-foreground">
            Cell load {Math.round(latest.load * 100)}% · surge runs{" "}
            {SURGE_TOTAL_SECONDS}s ({DEMO.rampSeconds}s ramp, {DEMO.holdSeconds}
            s peak, {DEMO.recoverSeconds}s recovery)
          </p>
        </div>
      </section>

      {/* KPIs */}
      <section
        aria-label="Live metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <KpiCard
          label="Latency (slice)"
          value={Math.round(latest.sliceLatency)}
          unit="ms"
          accent
          icon={<Activity />}
          detail={
            <>
              Standard{" "}
              <span className="font-semibold text-ink">
                {Math.round(latest.standardLatency)} ms
              </span>
              {latencyRatio > 1.5
                ? ` · ${latencyRatio.toFixed(1)}× slower`
                : ""}
            </>
          }
        />
        <KpiCard
          label="Throughput (slice)"
          value={Math.round(latest.sliceThroughput)}
          unit="Mbps"
          accent
          icon={<Gauge />}
          detail={
            <>
              Standard{" "}
              <span className="font-semibold text-ink">
                {Math.round(latest.standardThroughput)} Mbps
              </span>
            </>
          }
        />
        <KpiCard
          label="Packet loss (slice)"
          value={latest.sliceLoss.toFixed(2)}
          unit="%"
          accent
          icon={<Waves />}
          detail={
            <>
              Standard{" "}
              <span className="font-semibold text-ink">
                {latest.standardLoss.toFixed(2)}%
              </span>
            </>
          }
        />
        <KpiCard
          label="SLA status"
          value={sliceMet ? "Met" : "Breached"}
          icon={<ShieldCheck />}
          className={cn(
            "transition-colors",
            sliceMet ? "border-success/40" : "border-danger/40"
          )}
          detail={`≤${DEMO.slice.guaranteeLatencyMs} ms and ≥${DEMO.slice.guaranteeThroughputMbps} Mbps`}
        >
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Slice</span>
              <SliceBadge status={sliceMet ? "met" : "breached"} />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Standard</span>
              <SliceBadge
                status={standardMet ? "met" : "breached"}
                label={standardMet ? "Would meet" : "Would breach"}
              />
            </div>
          </div>
        </KpiCard>
        <KpiCard
          label="Uptime (slice)"
          value={up.slice.toFixed(1)}
          unit="%"
          accent
          icon={<TimerReset />}
          detail={
            <>
              Standard{" "}
              <span className="font-semibold text-ink">
                {up.standard.toFixed(1)}%
              </span>
              <span className="block text-xs">
                last {DEMO.windowSeconds}s, usable = &lt;
                {DEMO.usable.maxLatencyMs} ms, &lt;
                {DEMO.usable.maxLossPct}% loss
              </span>
            </>
          }
        />
      </section>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Latency"
          description="Round-trip time in milliseconds. Lower is better."
          actions={<ChartLegend items={LEGEND} />}
          footer="Simulated network. Illustrative values."
        >
          <LiveChartSlot
            kind="latency"
            state={state}
            summary={`Latency over the last ${DEMO.windowSeconds} seconds. Sliced connection now ${Math.round(latest.sliceLatency)} ms, standard network ${Math.round(latest.standardLatency)} ms. Guarantee is ${DEMO.slice.guaranteeLatencyMs} ms.`}
          />
        </ChartCard>
        <ChartCard
          title="Throughput"
          description="Delivered downlink in megabits per second. Higher is better."
          actions={<ChartLegend items={LEGEND} />}
          footer="Simulated network. Illustrative values."
        >
          <LiveChartSlot
            kind="throughput"
            state={state}
            summary={`Throughput over the last ${DEMO.windowSeconds} seconds. Sliced connection now ${Math.round(latest.sliceThroughput)} Mbps, standard network ${Math.round(latest.standardThroughput)} Mbps. Guarantee is ${DEMO.slice.guaranteeThroughputMbps} Mbps.`}
          />
        </ChartCard>
      </div>

      {/* Active slices + summary */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section
          className="min-w-0 rounded-lg border border-gray-mid bg-white shadow-card"
          aria-labelledby="slices-heading"
        >
          <div className="flex items-center justify-between p-5 pb-3 sm:px-6">
            <h2 id="slices-heading" className="text-lg font-bold text-ink">
              Active slices on campus
            </h2>
            <span className="text-xs text-muted-foreground">
              Updates every {DEMO.tickMs / 1000}s
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <caption className="sr-only">
                Simulated slices currently running or scheduled, with live
                latency against each slice&apos;s guarantee.
              </caption>
              <thead>
                <tr className="border-y border-gray-mid bg-gray-light text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2.5 font-semibold sm:px-6">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Use case
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-2.5 text-right font-semibold sm:px-6"
                  >
                    Latency / guarantee
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-mid">
                {state.slices.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 sm:px-6">
                      <span className="block font-semibold text-ink">
                        {s.customer}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.id} · {s.venue}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-ink">
                      {USE_CASES[s.useCase].short}
                    </td>
                    <td className="px-3 py-3">
                      <SliceBadge status={s.status} />
                    </td>
                    <td className="tabular px-5 py-3 text-right sm:px-6">
                      {s.latencyMs === null ? (
                        <span className="text-muted-foreground">
                          Starts 8 PM
                        </span>
                      ) : (
                        <>
                          <span className="font-bold text-ink">
                            {Math.round(s.latencyMs)} ms
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            / ≤{s.guaranteeLatencyMs} ms
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <SurgeSummaryCard state={state} />
      </div>
    </div>
  )
}

function LiveChartSlot({
  kind,
  state,
  summary,
}: {
  kind: "latency" | "throughput"
  state: DemoState
  summary: string
}) {
  return kind === "latency" ? (
    <LiveChart
      samples={state.samples}
      standardKey="standardLatency"
      sliceKey="sliceLatency"
      unit="ms"
      yLabel="Latency (ms)"
      yDomain={[0, 280]}
      guarantee={{
        value: DEMO.slice.guaranteeLatencyMs,
        label: `Guarantee ≤${DEMO.slice.guaranteeLatencyMs} ms`,
        labelSide: "above",
      }}
      surgeWindow={state.surgeWindow}
      summary={summary}
    />
  ) : (
    <LiveChart
      samples={state.samples}
      standardKey="standardThroughput"
      sliceKey="sliceThroughput"
      unit="Mbps"
      yLabel="Throughput (Mbps)"
      yDomain={[0, 140]}
      guarantee={{
        value: DEMO.slice.guaranteeThroughputMbps,
        label: `Guarantee ≥${DEMO.slice.guaranteeThroughputMbps} Mbps`,
        labelSide: "below",
      }}
      surgeWindow={state.surgeWindow}
      summary={summary}
    />
  )
}

function SurgeSummaryCard({ state }: { state: DemoState }) {
  const s = state.summary
  if (!s || s.samples === 0) {
    return (
      <section
        className="flex flex-col rounded-lg border border-gray-mid bg-gray-light p-6"
        aria-labelledby="summary-heading"
      >
        <h2 id="summary-heading" className="text-lg font-bold text-ink">
          What you&apos;re watching
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li>
            <span className="font-semibold text-ink">1. A crowd arrives.</span>{" "}
            Over {DEMO.rampSeconds} seconds, {formatInt(DEMO.peakDevices)}{" "}
            phones join the same cell.
          </li>
          <li>
            <span className="font-semibold text-ink">
              2. The shared network queues up.
            </span>{" "}
            The gray line climbs past 150 ms and throughput collapses.
          </li>
          <li>
            <span className="font-semibold text-ink">3. The slice holds.</span>{" "}
            Reserved radio and core resources keep the red line under its{" "}
            {DEMO.slice.guaranteeLatencyMs} ms guarantee.
          </li>
        </ol>
        <p className="mt-auto pt-6 text-xs text-muted-foreground">
          Press{" "}
          <span className="font-semibold text-ink">Start crowd surge</span> to
          begin. The run is seeded, so it plays the same way every time.
        </p>
      </section>
    )
  }
  const stdPct = (s.standardBreaches / s.samples) * 100
  return (
    <section
      className="flex flex-col rounded-lg border border-gray-mid bg-white p-6 shadow-card"
      aria-labelledby="summary-heading"
    >
      <h2 id="summary-heading" className="text-lg font-bold text-ink">
        {state.phase === "complete" ? "Surge results" : "This surge so far"}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-[#fff1f1] p-4">
          <dt className="text-xs font-semibold text-brand-red-dark">Slice</dt>
          <dd className="tabular mt-1 text-2xl font-extrabold text-ink">
            {s.sliceBreaches} misses
          </dd>
          <dd className="tabular text-xs text-muted-foreground">
            worst {Math.round(s.worstSliceLatency)} ms
          </dd>
        </div>
        <div className="rounded-lg bg-gray-light p-4">
          <dt className="text-xs font-semibold text-muted-foreground">
            Standard network
          </dt>
          <dd className="tabular mt-1 text-2xl font-extrabold text-ink">
            {Math.round(stdPct)}% missed
          </dd>
          <dd className="tabular text-xs text-muted-foreground">
            worst {Math.round(s.worstStandardLatency)} ms · low{" "}
            {Math.round(s.lowestStandardThroughput)} Mbps
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-muted-foreground">
        Over {s.samples} samples, the standard network would have missed the
        slice guarantee {s.standardBreaches} times. The slice missed it{" "}
        {s.sliceBreaches} times.
      </p>
    </section>
  )
}
