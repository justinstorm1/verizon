"use client"

import {
  BatteryLow,
  CircleCheck,
  Clock,
  Gauge,
  Plus,
  TriangleAlert,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { ChartCard } from "@/components/chart-card"
import { ChartTooltip } from "@/components/charts/chart-tooltip"
import {
  AXIS_LABEL_STYLE,
  AXIS_TICK,
  CHART_COLORS,
} from "@/components/charts/theme"
import { KpiCard } from "@/components/kpi-card"
import { PLAN_ICONS } from "@/components/plan-icon"
import { SliceBadge } from "@/components/slice-badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { Select } from "@/components/ui/select"
import {
  CELLS,
  EXTRA_HOURS,
  PLAN_ORDER,
  PLANS,
  SPEED_TIER_ORDER,
  SPEED_TIERS,
  type PlanId,
  type SpeedTierId,
} from "@/lib/config"
import { formatPct, formatUSDCents } from "@/lib/format"
import {
  accountReference,
  boostProfile,
  getCell,
  hourLabel,
  monthlyPrice,
  requestBoost,
  type BoostDecision,
  type Subscription,
} from "@/lib/simulate"
import { cn } from "@/lib/utils"

const SAMPLE_CELL: Record<PlanId, string> = {
  individual: "residence-halls",
  family: "stadium",
  "small-business": "food-truck-row",
  organization: "student-center",
}

/** Subscription from /account?plan=…&speed=…&extra=…&cell=… (set by the subscribe flow) */
function subscriptionFromUrl(): Subscription {
  const q = new URLSearchParams(window.location.search)
  const plan = PLAN_ORDER.find((p) => p === q.get("plan")) ?? "individual"
  const speed = SPEED_TIER_ORDER.find((t) => t === q.get("speed")) ?? "standard"
  const extra = Math.max(0, Number(q.get("extra")) || 0)
  const cellId =
    CELLS.find((c) => c.id === q.get("cell"))?.id ?? SAMPLE_CELL[plan]
  return { plan, speed, extraHours: extra, cellId }
}

/** Sample usage: 80% of this month's hours already used, so upgrade offers appear */
function initialUsed(sub: Subscription) {
  return Math.round(monthlyPrice(sub).boostHours * 0.8 * 2) / 2
}

/** Weekly split of hours used, for the usage chart */
function weeklyUsage(used: number) {
  const split = [0.18, 0.27, 0.2, 0.35]
  return split.map((s, i) => ({
    week: `Week ${i + 1}`,
    hours: Math.round(used * s * 10) / 10,
  }))
}

interface ActiveBoost {
  startHour: number
  hours: number
}

export function AccountDashboard() {
  const [sub, setSub] = useState<Subscription>(subscriptionFromUrl)
  const [used, setUsed] = useState(() => initialUsed(sub))
  const [topUps, setTopUps] = useState(0)
  const [hour, setHour] = useState(19)
  const [duration, setDuration] = useState(1)
  const [decision, setDecision] = useState<BoostDecision | null>(null)
  const [active, setActive] = useState<ActiveBoost | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const plan = PLANS[sub.plan]
  const Icon = PLAN_ICONS[sub.plan]
  const price = monthlyPrice(sub)
  const boost = boostProfile(sub.plan, sub.speed)
  const cell = getCell(sub.cellId)
  const totalHours = price.boostHours + topUps
  const left = Math.max(0, totalHours - used)
  const lowOnHours = left <= totalHours * 0.25
  const nextTier = SPEED_TIER_ORDER[SPEED_TIER_ORDER.indexOf(sub.speed) + 1] as
    SpeedTierId | undefined

  const switchSample = (planId: PlanId) => {
    const next: Subscription = {
      plan: planId,
      speed: "standard",
      extraHours: 0,
      cellId: SAMPLE_CELL[planId],
    }
    setSub(next)
    setUsed(initialUsed(next))
    setTopUps(0)
    setDecision(null)
    setActive(null)
    setNotice(null)
  }

  const startBoost = () => {
    const d = requestBoost(sub, hour)
    setDecision(d)
    if (d.admitted) {
      const hours = Math.min(duration, left)
      setActive({ startHour: hour, hours })
      setUsed((u) => u + hours)
      setNotice(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account header */}
      <section
        aria-label="Your plan"
        className="flex flex-col gap-5 rounded-lg border border-gray-mid bg-white p-5 shadow-card md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-lg bg-ink text-white">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-lg font-bold text-ink">
              {plan.name} · {SPEED_TIERS[sub.speed].name}
            </p>
            <p className="tabular text-sm text-muted-foreground">
              {accountReference(JSON.stringify(sub))} · {cell.name} ·{" "}
              {formatUSDCents(price.total)}/month
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field id="sample" label="Sample account" className="min-w-48">
            <Select
              id="sample"
              value={sub.plan}
              onChange={(e) => switchSample(e.target.value as PlanId)}
            >
              {PLAN_ORDER.map((id) => (
                <option key={id} value={id}>
                  {PLANS[id].name}
                </option>
              ))}
            </Select>
          </Field>
          <Link
            href={`/subscribe?plan=${sub.plan}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Change plan
          </Link>
        </div>
      </section>

      {notice ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-tint px-4 py-3 text-sm font-semibold text-success"
        >
          <CircleCheck className="size-4" aria-hidden="true" />
          {notice}
        </p>
      ) : null}

      {/* KPIs */}
      <section
        aria-label="This month"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KpiCard
          label="Boost hours left"
          value={left.toFixed(1)}
          unit={`of ${totalHours} h`}
          accent
          icon={<Clock />}
        >
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-gray-light"
            role="meter"
            aria-label="Boost hours used this month"
            aria-valuemin={0}
            aria-valuemax={totalHours}
            aria-valuenow={Math.round(used * 10) / 10}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300",
                lowOnHours ? "bg-brand-red" : "bg-ink"
              )}
              style={{ width: `${Math.min(100, (used / totalHours) * 100)}%` }}
            />
          </div>
        </KpiCard>
        <KpiCard
          label="Boost guarantee"
          value={boost.throughputMbps}
          unit="Mbps"
          icon={<Zap />}
          detail={`≤${boost.maxLatencyMs} ms · ${boost.reliability}% reliability`}
        />
        <KpiCard
          label="Everyday"
          value={plan.floorMbps ? `${plan.floorMbps}` : "Priority"}
          unit={plan.floorMbps ? "Mbps floor" : undefined}
          icon={<Gauge />}
          detail="Ahead of regular traffic, all month"
        />
        <KpiCard
          label="Status"
          value={active ? "Boosting" : "Priority"}
          icon={<Zap />}
          detail={
            active
              ? `${hourLabel(active.startHour)} to ${hourLabel(active.startHour + active.hours)}`
              : "No boost running"
          }
        >
          <div className="mt-3">
            <SliceBadge status={active ? "boosting" : "priority"} />
          </div>
        </KpiCard>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* Start a boost */}
        <section
          aria-labelledby="boost-heading"
          className="rounded-lg border border-gray-mid bg-white p-5 shadow-card sm:p-6"
        >
          <h2 id="boost-heading" className="text-lg font-bold text-ink">
            Start a boost
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A boost starts only if your plan&apos;s share of {cell.name}&apos;s
            guaranteed pool has room. If it&apos;s full, you get the next open
            time, never a slower boost.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="clock" label="Time of day (simulated)">
              <Select
                id="clock"
                value={hour}
                onChange={(e) => {
                  setHour(Number(e.target.value))
                  setDecision(null)
                }}
              >
                {Array.from({ length: 17 }, (_, i) => i + 7).map((h) => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="duration" label="Boost length">
              <Select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                {[1, 2, 3].map((d) => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? "hour" : "hours"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              onClick={startBoost}
              disabled={!!active || left <= 0}
            >
              <Zap />
              Start boost
            </Button>
            {active ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setActive(null)
                  setDecision(null)
                }}
              >
                End boost
              </Button>
            ) : null}
            {left <= 0 ? (
              <span className="text-sm text-danger">
                No boost hours left this month.
              </span>
            ) : null}
          </div>

          {decision ? (
            <div className="mt-5">
              <PoolMeter
                decision={decision}
                label={`${plan.name} pool on ${cell.name} at ${hourLabel(hour)}`}
              />
              {decision.admitted ? (
                <p
                  role="status"
                  className="mt-3 flex gap-2 rounded-lg border border-success/30 bg-success-tint p-3 text-sm text-success"
                >
                  <CircleCheck
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  Boost active: {boost.throughputMbps} Mbps at ≤
                  {boost.maxLatencyMs} ms guaranteed until{" "}
                  {hourLabel(hour + (active?.hours ?? duration))}.
                </p>
              ) : (
                <div
                  role="alert"
                  className="mt-3 flex gap-2 rounded-lg border border-danger/30 bg-danger-tint p-3 text-sm text-danger"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <div>
                    <p>
                      The {plan.name} pool on {cell.name} is full at{" "}
                      {hourLabel(hour)}. Starting a boost now would break other
                      subscribers&apos; guarantees, so it wasn&apos;t started
                      and no hours were used.
                    </p>
                    {decision.nextHour !== null ? (
                      <button
                        type="button"
                        onClick={() => {
                          setHour(decision.nextHour!)
                          setDecision(null)
                        }}
                        className="mt-2 font-semibold underline underline-offset-4 hover:text-ink"
                      >
                        Try at {hourLabel(decision.nextHour)}
                      </button>
                    ) : (
                      <p className="mt-2 font-semibold">
                        No openings later today.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </section>

        {/* Upgrades */}
        <section
          aria-labelledby="upgrade-heading"
          className={cn(
            "rounded-lg border p-5 shadow-card sm:p-6",
            lowOnHours
              ? "border-brand-red/40 bg-[#fff8f8]"
              : "border-gray-mid bg-white"
          )}
        >
          <div className="flex items-center gap-2">
            {lowOnHours ? (
              <BatteryLow
                className="size-5 text-brand-red"
                aria-hidden="true"
              />
            ) : (
              <Plus className="size-5 text-ink" aria-hidden="true" />
            )}
            <h2 id="upgrade-heading" className="text-lg font-bold text-ink">
              {lowOnHours
                ? `Running low: ${left.toFixed(1)} hours left`
                : "Upgrades"}
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Add time for this month or upgrade your speed. Charges are
            simulated.
          </p>

          <h3 className="mt-5 text-sm font-semibold text-ink">
            More time (one-time)
          </h3>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {EXTRA_HOURS.topUpPacks.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => {
                  setTopUps((t) => t + h)
                  setNotice(
                    `Added ${h} boost hours (simulated charge ${formatUSDCents(h * plan.extraHourPrice)}).`
                  )
                }}
                className="rounded-lg border-2 border-gray-mid bg-white px-2 py-3 text-center transition-colors hover:border-ink"
              >
                <span className="tabular block font-bold text-ink">+{h} h</span>
                <span className="tabular block text-xs text-muted-foreground">
                  {formatUSDCents(h * plan.extraHourPrice)}
                </span>
              </button>
            ))}
          </div>

          <h3 className="mt-6 text-sm font-semibold text-ink">
            More speed (monthly)
          </h3>
          {nextTier ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-mid bg-white p-4">
              <div className="text-sm">
                <p className="font-semibold text-ink">
                  Upgrade to {SPEED_TIERS[nextTier].name}
                </p>
                <p className="tabular text-muted-foreground">
                  {boostProfile(sub.plan, nextTier).throughputMbps} Mbps, ≤
                  {boostProfile(sub.plan, nextTier).maxLatencyMs} ms · +
                  {formatUSDCents(
                    monthlyPrice({ ...sub, speed: nextTier }).total -
                      price.total
                  )}
                  /mo
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSub((s) => ({ ...s, speed: nextTier }))
                  setDecision(null)
                  setNotice(
                    `Upgraded to ${SPEED_TIERS[nextTier].name} speed (simulated).`
                  )
                }}
              >
                Upgrade
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              You&apos;re on the fastest tier.
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Faster tiers use more of the guaranteed pool, so their boosts are
            refused sooner when a cell is busy.
          </p>
        </section>
      </div>

      <ChartCard
        title="Boost hours used this month"
        description="Sample usage history for this account."
        footer="Simulated usage."
      >
        <div
          className="h-[220px] w-full"
          role="img"
          aria-label={`Bar chart of boost hours used per week: ${weeklyUsage(
            used
          )
            .map((w) => `${w.week} ${w.hours} hours`)
            .join(", ")}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyUsage(used)}
              margin={{ top: 8, right: 8, bottom: 20, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="week"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.standardLight }}
                label={{
                  value: "Week of month",
                  position: "insideBottom",
                  offset: -12,
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <YAxis
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={48}
                label={{
                  value: "Hours",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  style: { ...AXIS_LABEL_STYLE, textAnchor: "middle" },
                }}
              />
              <Tooltip
                cursor={{ fill: CHART_COLORS.ink, fillOpacity: 0.04 }}
                content={({ active: on, payload }) => {
                  const d = payload?.[0]?.payload as
                    { week: string; hours: number } | undefined
                  if (!on || !d) return null
                  return (
                    <ChartTooltip
                      title={d.week}
                      rows={[
                        {
                          label: "Boost hours",
                          value: `${d.hours} h`,
                          color: CHART_COLORS.slice,
                          emphasis: true,
                        },
                      ]}
                    />
                  )
                }}
              />
              <Bar
                dataKey="hours"
                name="Boost hours"
                fill={CHART_COLORS.slice}
                radius={[4, 4, 0, 0]}
                maxBarSize={56}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  )
}

function PoolMeter({
  decision,
  label,
}: {
  decision: BoostDecision
  label: string
}) {
  const inUse = Math.min(decision.inUse, 1)
  const extra = Math.max(0, Math.min(decision.withBoost, 1) - inUse)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="font-semibold text-ink" id="pool-label">
          {label}
        </p>
        <p className="tabular text-xs text-muted-foreground">
          {formatPct(decision.inUse)} in use
        </p>
      </div>
      <div
        className="mt-2 flex h-3 overflow-hidden rounded-full bg-gray-light"
        role="meter"
        aria-labelledby="pool-label"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(inUse * 100)}
        aria-valuetext={`${formatPct(decision.inUse)} of the pool in use; this boost would bring it to ${formatPct(decision.withBoost)}`}
      >
        <div
          className="h-full bg-gray-dark"
          style={{ width: `${inUse * 100}%` }}
        />
        <div
          className={cn(
            "h-full border-l-2 border-white",
            decision.admitted
              ? "bg-brand-red"
              : "bg-[repeating-linear-gradient(135deg,var(--brand-red)_0_6px,#ff6b6b_6px_10px)]"
          )}
          style={{ width: `${extra * 100}%` }}
        />
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm bg-gray-dark"
            aria-hidden="true"
          />
          Other boosts
        </li>
        <li className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm bg-brand-red"
            aria-hidden="true"
          />
          Your boost
        </li>
      </ul>
    </div>
  )
}
