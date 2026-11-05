/**
 * Priority 5G simulation engine.
 *
 * Pure, deterministic functions for the simulated systems behind the demo:
 *  1. Live network: regular network vs. a guaranteed priority slice under a crowd surge
 *  2. Subscriptions: plan pricing, eligibility, per-cell seat limits, boost admission
 *  3. Density: what happens to priority when more and more people subscribe
 *  4. Business case: 12-month subscription projection
 *
 * Constants live in ./config.ts. Randomness is seeded (./random.ts), so every
 * run renders the same story.
 */

import {
  ACTIVE_SUBSCRIBERS,
  BUSINESS,
  CAPACITY,
  CELLS,
  DEMO,
  DENSITY,
  DEVICE_TYPES,
  MIN_LATENCY_MS,
  PLAN_ORDER,
  PLANS,
  SPEED_TIERS,
  type BusinessAssumptions,
  type Cell,
  type DeviceType,
  type DeviceTypeId,
  type PlanId,
  type SpeedTierId,
  type SubscriberStatus,
} from "./config"
import { clamp, gaussian, hashString, noise } from "./random"

const smoothstep = (x: number) => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

// ===========================================================================
// 1. Live network simulation
// ===========================================================================

export type SurgePhase = "idle" | "ramping" | "peak" | "recovering" | "complete"

export const SURGE_TOTAL_SECONDS =
  DEMO.rampSeconds + DEMO.holdSeconds + DEMO.recoverSeconds

/** Crowd load (0-1) and phase, given seconds since the surge started */
export function surgeLoad(secondsSinceStart: number | null): {
  load: number
  phase: SurgePhase
} {
  const { idleLoad, peakLoad, rampSeconds, holdSeconds, recoverSeconds } = DEMO
  if (secondsSinceStart === null) return { load: idleLoad, phase: "idle" }
  const s = secondsSinceStart
  if (s < rampSeconds) {
    return {
      load: idleLoad + (peakLoad - idleLoad) * smoothstep(s / rampSeconds),
      phase: "ramping",
    }
  }
  if (s < rampSeconds + holdSeconds) return { load: peakLoad, phase: "peak" }
  if (s < SURGE_TOTAL_SECONDS) {
    const r = (s - rampSeconds - holdSeconds) / recoverSeconds
    return {
      load: peakLoad - (peakLoad - idleLoad) * smoothstep(r),
      phase: "recovering",
    }
  }
  return { load: idleLoad, phase: "complete" }
}

export interface NetworkSample {
  /** Seconds on the demo timeline */
  t: number
  load: number
  devices: number
  standardLatency: number
  sliceLatency: number
  standardThroughput: number
  sliceThroughput: number
  standardLoss: number
  sliceLoss: number
}

/** One measurement of both connections at a given load. `key` seeds the noise. */
export function sampleNetwork(
  t: number,
  load: number,
  key: number
): NetworkSample {
  const S = DEMO.standard
  const L = DEMO.slice
  const seed = DEMO.seed

  // Standard network: queueing delay grows sharply as the cell saturates.
  const jitterSd =
    S.jitterMs.idle + (S.jitterMs.peak - S.jitterMs.idle) * load ** 2
  let standardLatency =
    S.baseLatencyMs +
    (S.peakLatencyMs - S.baseLatencyMs) * load ** 3 +
    gaussian(seed, key, 11) * jitterSd
  if (noise(seed, key, 12) < S.spikeChance * load ** 2) {
    standardLatency +=
      S.spikeMs.min + (S.spikeMs.max - S.spikeMs.min) * noise(seed, key, 13)
  }
  standardLatency = Math.max(S.baseLatencyMs * 0.8, standardLatency)

  const standardThroughput = clamp(
    S.idleThroughputMbps *
      (1 - 0.94 * load ** 1.6) *
      (1 + 0.06 * gaussian(seed, key, 14)),
    S.minThroughputMbps,
    S.idleThroughputMbps * 1.1
  )

  const standardLoss = clamp(
    S.baseLossPct +
      (S.peakLossPct - S.baseLossPct) * load ** 4 +
      0.25 * load * gaussian(seed, key, 15),
    0.02,
    S.peakLossPct * 1.3
  )

  // Slice: isolated resources keep latency and throughput inside the guarantee.
  const sliceLatency = clamp(
    L.typicalLatencyMs +
      L.loadLatencyMs * load +
      gaussian(seed, key, 21) * L.jitterMs,
    L.typicalLatencyMs - 4,
    L.guaranteeLatencyMs - 2
  )
  const sliceThroughput = clamp(
    L.typicalThroughputMbps + 1.2 * gaussian(seed, key, 22),
    L.guaranteeThroughputMbps + 0.5,
    L.typicalThroughputMbps + 4
  )
  const sliceLoss = L.lossPct * (0.6 + 0.8 * noise(seed, key, 23))

  return {
    t,
    load,
    devices: Math.round(load * DEMO.peakDevices),
    standardLatency,
    sliceLatency,
    standardThroughput,
    sliceThroughput,
    standardLoss,
    sliceLoss,
  }
}

export function isUsable(latencyMs: number, lossPct: number) {
  return (
    latencyMs <= DEMO.usable.maxLatencyMs && lossPct <= DEMO.usable.maxLossPct
  )
}

/** Whether a connection would meet the slice's guarantee (latency and throughput) */
export function meetsGuarantee(latencyMs: number, throughputMbps: number) {
  return (
    latencyMs <= DEMO.slice.guaranteeLatencyMs &&
    throughputMbps >= DEMO.slice.guaranteeThroughputMbps
  )
}

export interface SubscriberRow {
  id: string
  name: string
  plan: PlanId
  cell: string
  status: SubscriberStatus
  guaranteeLatencyMs: number
  /** Current latency; null while waitlisted */
  latencyMs: number | null
}

/** Live rows for the subscriber table. Boosting rows stay inside their guarantee. */
export function sampleSubscribers(load: number, key: number): SubscriberRow[] {
  return ACTIVE_SUBSCRIBERS.map((s, i) => {
    const jitter = gaussian(DEMO.seed, key, 100 + i)
    let latencyMs: number | null = null
    if (s.status === "boosting") {
      latencyMs = clamp(
        s.typicalLatencyMs + 2.5 * load + 0.9 * jitter,
        s.typicalLatencyMs - 3,
        s.guaranteeLatencyMs - 1
      )
    } else if (s.status === "priority") {
      // Everyday priority: ahead of regular traffic, but not guaranteed.
      latencyMs = Math.max(
        12,
        s.typicalLatencyMs + 14 * load ** 2 + 1.5 * jitter
      )
    }
    return {
      id: s.id,
      name: s.name,
      plan: s.plan,
      cell: s.cell,
      status: s.status,
      guaranteeLatencyMs: s.guaranteeLatencyMs,
      latencyMs,
    }
  })
}

export interface SurgeSummary {
  samples: number
  standardBreaches: number
  sliceBreaches: number
  worstStandardLatency: number
  worstSliceLatency: number
  lowestStandardThroughput: number
}

export interface DemoState {
  tick: number
  surgeStartTick: number | null
  phase: SurgePhase
  samples: NetworkSample[]
  subscribers: SubscriberRow[]
  summary: SurgeSummary | null
  /** Timeline seconds the most recent surge started and ended (end null while running) */
  surgeWindow: { start: number; end: number | null } | null
}

const TICK_SECONDS = DEMO.tickMs / 1000
const WINDOW_TICKS = Math.round(DEMO.windowSeconds / TICK_SECONDS)

function emptySummary(): SurgeSummary {
  return {
    samples: 0,
    standardBreaches: 0,
    sliceBreaches: 0,
    worstStandardLatency: 0,
    worstSliceLatency: 0,
    lowestStandardThroughput: Infinity,
  }
}

function addToSummary(summary: SurgeSummary, s: NetworkSample): SurgeSummary {
  return {
    samples: summary.samples + 1,
    standardBreaches:
      summary.standardBreaches +
      (meetsGuarantee(s.standardLatency, s.standardThroughput) ? 0 : 1),
    sliceBreaches:
      summary.sliceBreaches +
      (meetsGuarantee(s.sliceLatency, s.sliceThroughput) ? 0 : 1),
    worstStandardLatency: Math.max(
      summary.worstStandardLatency,
      s.standardLatency
    ),
    worstSliceLatency: Math.max(summary.worstSliceLatency, s.sliceLatency),
    lowestStandardThroughput: Math.min(
      summary.lowestStandardThroughput,
      s.standardThroughput
    ),
  }
}

/** Advance the demo by one tick (pure). */
export function advanceDemo(state: DemoState): DemoState {
  const tick = state.tick + 1
  const sinceStart =
    state.surgeStartTick === null
      ? null
      : (tick - state.surgeStartTick) * TICK_SECONDS
  const { load, phase } = surgeLoad(sinceStart)
  // Surge ticks are keyed relative to the start so every surge replays identically.
  const key =
    state.surgeStartTick === null
      ? tick
      : 1_000_000 + (tick - state.surgeStartTick)
  const sample = sampleNetwork(tick * TICK_SECONDS, load, key)
  const samples = [...state.samples, sample].slice(-WINDOW_TICKS)
  const surging =
    phase === "ramping" || phase === "peak" || phase === "recovering"
  const justEnded = phase === "complete" && state.surgeStartTick !== null

  return {
    tick,
    surgeStartTick: phase === "complete" ? null : state.surgeStartTick,
    phase: phase === "idle" && state.phase === "complete" ? "complete" : phase,
    samples,
    subscribers: sampleSubscribers(load, key),
    summary:
      surging && state.summary
        ? addToSummary(state.summary, sample)
        : state.summary,
    surgeWindow:
      justEnded && state.surgeWindow
        ? { ...state.surgeWindow, end: sample.t }
        : state.surgeWindow,
  }
}

export function startSurge(state: DemoState): DemoState {
  return {
    ...state,
    surgeStartTick: state.tick,
    phase: "ramping",
    summary: emptySummary(),
    surgeWindow: { start: state.tick * TICK_SECONDS, end: null },
  }
}

/** Initial state with a few seconds of idle history so the charts open populated. */
export function initialDemoState(): DemoState {
  let state: DemoState = {
    tick: 0,
    surgeStartTick: null,
    phase: "idle",
    samples: [],
    subscribers: sampleSubscribers(DEMO.idleLoad, 0),
    summary: null,
    surgeWindow: null,
  }
  const prefill = Math.round(DEMO.prefillSeconds / TICK_SECONDS)
  for (let i = 0; i < prefill; i++) state = advanceDemo(state)
  return state
}

/** Share (%) of samples in which each connection stayed usable */
export function uptime(samples: NetworkSample[]) {
  if (!samples.length) return { standard: 100, slice: 100 }
  const std = samples.filter((s) =>
    isUsable(s.standardLatency, s.standardLoss)
  ).length
  const slc = samples.filter((s) =>
    isUsable(s.sliceLatency, s.sliceLoss)
  ).length
  return {
    standard: (std / samples.length) * 100,
    slice: (slc / samples.length) * 100,
  }
}

// ===========================================================================
// 2. Subscriptions: pricing, eligibility, seats, boosts
// ===========================================================================

export function getCell(id: string): Cell {
  return CELLS.find((c) => c.id === id) ?? CELLS[0]
}

export function getDevice(id: DeviceTypeId): DeviceType {
  return DEVICE_TYPES.find((d) => d.id === id) ?? DEVICE_TYPES[0]
}

export function hourLabel(hour: number) {
  const h = ((Math.round(hour) % 24) + 24) % 24
  const suffix = h < 12 ? "AM" : "PM"
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display} ${suffix}`
}

export interface Subscription {
  plan: PlanId
  speed: SpeedTierId
  /** Extra boost hours added to every month */
  extraHours: number
  cellId: string
}

/** The guarantee a subscriber gets while boosting */
export function boostProfile(plan: PlanId, speed: SpeedTierId) {
  const p = PLANS[plan]
  const t = SPEED_TIERS[speed]
  return {
    throughputMbps: p.boost.throughputMbps * t.throughputMultiplier,
    maxLatencyMs: Math.max(
      MIN_LATENCY_MS,
      p.boost.maxLatencyMs - t.latencyReductionMs
    ),
    reliability: p.boost.reliability,
  }
}

export interface MonthlyPrice {
  base: number
  speedUpgrade: number
  extraHours: number
  total: number
  boostHours: number
}

export function monthlyPrice(
  sub: Pick<Subscription, "plan" | "speed" | "extraHours">
): MonthlyPrice {
  const p = PLANS[sub.plan]
  const speedUpgrade = p.price * SPEED_TIERS[sub.speed].priceUplift
  const extraHours = sub.extraHours * p.extraHourPrice
  return {
    base: p.price,
    speedUpgrade,
    extraHours,
    total: p.price + speedUpgrade + extraHours,
    boostHours: p.boostHours + sub.extraHours,
  }
}

/** Mbps of guaranteed pool one subscription needs at peak (expected concurrency x boost) */
export function seatLoadMbps(plan: PlanId, speed: SpeedTierId) {
  return boostProfile(plan, speed).throughputMbps * PLANS[plan].peakConcurrency
}

/** Guaranteed pool (Mbps) for one segment on one cell */
export function segmentPoolMbps(
  capacityMbps: number,
  plan: PlanId,
  poolCap = CAPACITY.guaranteedPoolCap
) {
  return capacityMbps * poolCap * PLANS[plan].poolShare
}

export interface SeatAvailability {
  /** Seats this plan and speed would have on an empty cell */
  total: number
  /** Seats still open */
  open: number
  /** Share of this segment's pool already sold, 0-1+ */
  soldShare: number
  soldOut: boolean
}

/** Admission control: how many more subscriptions of this plan and speed a cell can take */
export function seatAvailability(
  sub: Pick<Subscription, "plan" | "speed" | "cellId">
): SeatAvailability {
  const cell = getCell(sub.cellId)
  const pool = segmentPoolMbps(cell.capacityMbps, sub.plan)
  const load = seatLoadMbps(sub.plan, sub.speed)
  const jitter =
    (noise(hashString(`${cell.id}|${sub.plan}`)) - 0.5) * 2 * CAPACITY.noise
  const soldShare = clamp(cell.demand + jitter, 0, 1.1)
  // A tier whose single boost is bigger than the whole pool can't be offered here.
  const offered = boostProfile(sub.plan, sub.speed).throughputMbps <= pool
  const total = offered ? Math.floor(pool / load) : 0
  const open = offered
    ? Math.max(0, Math.floor((pool * (1 - soldShare)) / load))
    : 0
  return { total, open, soldShare, soldOut: open === 0 }
}

export type CheckStatus = "pass" | "warn" | "fail"

export interface EligibilityResult {
  id: "coverage" | "device"
  title: string
  status: CheckStatus
  detail: string
  /** A concrete way forward when the check fails */
  fix?: { label: string; cellId?: string; deviceId?: DeviceTypeId }
}

/** Simulated eligibility checks for a home cell and device type */
export function checkEligibility(
  cellId: string,
  deviceId: DeviceTypeId
): EligibilityResult[] {
  const cell = getCell(cellId)
  const device = getDevice(deviceId)
  const alt = cell.alternativeCellId ? getCell(cell.alternativeCellId) : null
  return [
    {
      id: "coverage",
      title: "Standalone 5G coverage where you'll use it",
      status:
        cell.saCoverage === "full"
          ? "pass"
          : cell.saCoverage === "partial"
            ? "warn"
            : "fail",
      detail: cell.coverageNote,
      fix: alt ? { label: `Switch to ${alt.name}`, cellId: alt.id } : undefined,
    },
    {
      id: "device",
      title: "Device compatibility",
      status: device.result,
      detail: device.message,
      fix:
        device.alternativeId && device.alternativeLabel
          ? { label: device.alternativeLabel, deviceId: device.alternativeId }
          : undefined,
    },
  ]
}

/** Share (0-1+) of a segment's guaranteed pool in use by boosts at a given hour */
export function boostPoolInUse(cellId: string, plan: PlanId, hour: number) {
  const cell = getCell(cellId)
  const h = ((Math.floor(hour) % 24) + 24) % 24
  const jitter =
    (noise(hashString(`${cell.id}|boost|${plan}`), h) - 0.5) *
    2 *
    CAPACITY.noise
  return clamp(cell.busyHourBoostUse * CAPACITY.hourShape[h] + jitter, 0, 1.1)
}

export interface BoostDecision {
  admitted: boolean
  /** Pool in use before this boost, and after if admitted (0-1+) */
  inUse: number
  withBoost: number
  /** Next hour today with room, when refused */
  nextHour: number | null
}

/**
 * Boost admission: a boost starts only if the segment's pool has room for it.
 * Otherwise it is refused with the next available hour. It is never started degraded.
 */
export function requestBoost(
  sub: Pick<Subscription, "plan" | "speed" | "cellId">,
  hour: number
): BoostDecision {
  const cell = getCell(sub.cellId)
  const pool = segmentPoolMbps(cell.capacityMbps, sub.plan)
  const share = boostProfile(sub.plan, sub.speed).throughputMbps / pool
  const fits = (h: number) =>
    boostPoolInUse(sub.cellId, sub.plan, h) + share <= 1
  const inUse = boostPoolInUse(sub.cellId, sub.plan, hour)
  let nextHour: number | null = null
  if (!fits(hour)) {
    for (let h = Math.floor(hour) + 1; h < 24; h++) {
      if (fits(h)) {
        nextHour = h
        break
      }
    }
  }
  return { admitted: fits(hour), inUse, withBoost: inUse + share, nextHour }
}

export function accountReference(seed: string) {
  const h = hashString(seed).toString(36).toUpperCase()
  return `P5-${h.slice(0, 6).padEnd(6, "0")}`
}

// ===========================================================================
// 3. Density: "if everyone subscribes, isn't it just normal 5G?"
// ===========================================================================

export interface DensityPoint {
  /** Share of devices subscribed, 0-100 */
  subscribed: number
  /** Share actually admitted to priority, 0-100 */
  admitted: number
  priorityLatency: number
  standardLatency: number
}

/**
 * Latency for priority and regular users during a surge, as the share of
 * subscribed devices grows. With admission control, priority load is capped
 * at the guaranteed pool; extra subscribers wait for a seat instead of
 * diluting everyone else's guarantee.
 */
export function densityPoint(
  subscribedShare: number,
  admissionControl: boolean,
  poolCap = CAPACITY.guaranteedPoolCap
): DensityPoint {
  const L = DENSITY.surgeLoad
  const admitted = admissionControl
    ? Math.min(subscribedShare, poolCap)
    : subscribedShare
  const priorityLoad = admitted * L
  const priorityLatency =
    DENSITY.priorityBaseMs + DENSITY.prioritySpanMs * priorityLoad ** 3
  const standardBase =
    DEMO.standard.baseLatencyMs +
    (DEMO.standard.peakLatencyMs - DEMO.standard.baseLatencyMs) * L ** 3
  const standardLatency =
    standardBase * (1 + DENSITY.standardPenalty * admitted)
  return {
    subscribed: subscribedShare * 100,
    admitted: admitted * 100,
    priorityLatency,
    standardLatency: Math.max(priorityLatency, standardLatency),
  }
}

export function densityCurve(
  admissionControl: boolean,
  poolCap = CAPACITY.guaranteedPoolCap
) {
  return Array.from({ length: 21 }, (_, i) =>
    densityPoint(i / 20, admissionControl, poolCap)
  )
}

// ===========================================================================
// 4. Business case
// ===========================================================================

export interface MonthProjection {
  month: number
  label: string
  subscribers: Record<PlanId, number>
  totalSubscribers: number
  revenue: Record<PlanId, number>
  totalRevenue: number
  cumulativeNet: number
}

export interface SegmentCapacity {
  plan: PlanId
  label: string
  /** Seats across all sites (subscribers the guaranteed pool can hold) */
  seats: number
  /** Subscribers at month 12 */
  subscribers: number
  /** Demand turned away to the waitlist by month 12 */
  waitlist: number
}

export interface FunnelStage {
  stage: string
  description: string
  customers: number
}

export interface BusinessProjection {
  months: MonthProjection[]
  yearOneRevenue: number
  /** Month-12 recurring revenue x 12 */
  exitArr: number
  /** Average revenue per subscriber per month at month 12 */
  arpu: number
  upfrontCost: number
  paybackMonths: number | null
  revenueMix: {
    id: "base" | "speed" | "time"
    label: string
    value: number
    share: number
  }[]
  capacity: SegmentCapacity[]
  subscribersAtExit: number
  waitlistAtExit: number
  funnel: FunnelStage[]
}

/** Subscription seats per site for each plan (Standard speed, average cell) */
export function seatsPerSite(plan: PlanId, poolCap: number) {
  return Math.floor(
    segmentPoolMbps(BUSINESS.avgCellCapacityMbps, plan, poolCap) /
      seatLoadMbps(plan, "standard")
  )
}

export function projectBusiness(a: BusinessAssumptions): BusinessProjection {
  const upfrontCost =
    BUSINESS.platformCost + BUSINESS.perSiteCost * a.numberOfSites
  const netShare = 1 - BUSINESS.operatingCostShare
  const upgradeFactor = 1 + a.upgradeRate * BUSINESS.upgradeSpendShare

  const seats = Object.fromEntries(
    PLAN_ORDER.map((id) => [
      id,
      seatsPerSite(id, a.guaranteedPoolCap) * a.numberOfSites,
    ])
  ) as Record<PlanId, number>
  const subs = Object.fromEntries(PLAN_ORDER.map((id) => [id, 0])) as Record<
    PlanId,
    number
  >
  const waitlist = Object.fromEntries(
    PLAN_ORDER.map((id) => [id, 0])
  ) as Record<PlanId, number>
  let totalSignups = 0

  let cumulative = -upfrontCost
  const months: MonthProjection[] = []
  for (let m = 1; m <= BUSINESS.months; m++) {
    const adoption =
      BUSINESS.adoptionStart +
      (1 - BUSINESS.adoptionStart) * smoothstep((m - 1) / (BUSINESS.months - 1))
    const revenue = {} as Record<PlanId, number>
    for (const id of PLAN_ORDER) {
      const demand =
        a.signupsPerSitePerMonth *
        a.numberOfSites *
        adoption *
        BUSINESS.signupMix[id]
      const retained = subs[id] * (1 - a.monthlyChurn)
      const room = Math.max(0, seats[id] - retained)
      const admitted = Math.min(demand, room)
      subs[id] = retained + admitted
      waitlist[id] += demand - admitted
      totalSignups += admitted
      revenue[id] = subs[id] * PLANS[id].price * upgradeFactor
    }
    const totalRevenue = PLAN_ORDER.reduce((s, id) => s + revenue[id], 0)
    cumulative += totalRevenue * netShare
    months.push({
      month: m,
      label: `M${m}`,
      subscribers: Object.fromEntries(
        PLAN_ORDER.map((id) => [id, Math.round(subs[id])])
      ) as Record<PlanId, number>,
      totalSubscribers: Math.round(
        PLAN_ORDER.reduce((s, id) => s + subs[id], 0)
      ),
      revenue,
      totalRevenue,
      cumulativeNet: cumulative,
    })
  }

  const last = months[months.length - 1]
  const yearOneRevenue = months.reduce((s, m) => s + m.totalRevenue, 0)

  let paybackMonths: number | null = null
  const hit = months.find((m) => m.cumulativeNet >= 0)
  if (hit) paybackMonths = hit.month
  else {
    const lastNet = last.totalRevenue * netShare
    if (lastNet > 0)
      paybackMonths = BUSINESS.months + Math.ceil(-cumulative / lastNet)
  }

  const upgradeShare = (upgradeFactor - 1) / upgradeFactor
  const baseRevenue = yearOneRevenue * (1 - upgradeShare)
  const upgradeRevenue = yearOneRevenue * upgradeShare
  const revenueMix = [
    { id: "base" as const, label: "Base subscriptions", value: baseRevenue },
    {
      id: "speed" as const,
      label: "Speed upgrades",
      value: upgradeRevenue * BUSINESS.upgradeSplit.speed,
    },
    {
      id: "time" as const,
      label: "Extra boost hours",
      value: upgradeRevenue * BUSINESS.upgradeSplit.time,
    },
  ].map((r) => ({ ...r, share: yearOneRevenue ? r.value / yearOneRevenue : 0 }))

  const capacity = PLAN_ORDER.map((id) => ({
    plan: id,
    label: PLANS[id].name,
    seats: seats[id],
    subscribers: last.subscribers[id],
    waitlist: Math.round(waitlist[id]),
  }))

  const businessSubs =
    last.subscribers.organization + last.subscribers["small-business"]
  const upgraded = Math.round(last.totalSubscribers * a.upgradeRate)
  const funnel: FunnelStage[] = [
    {
      stage: "Free first month",
      description: "Started a trial",
      customers: Math.round(totalSignups / BUSINESS.funnel.trialToPaid),
    },
    {
      stage: "Paid subscriber",
      description: "Active at month 12",
      customers: last.totalSubscribers,
    },
    {
      stage: "Upgraded",
      description: "Paying for more speed or time",
      customers: upgraded,
    },
    {
      stage: "Enterprise lead",
      description: "Org or business referred to enterprise slicing",
      customers: Math.round(
        businessSubs * BUSINESS.funnel.enterpriseReferralRate
      ),
    },
  ]

  return {
    months,
    yearOneRevenue,
    exitArr: last.totalRevenue * 12,
    arpu: last.totalSubscribers ? last.totalRevenue / last.totalSubscribers : 0,
    upfrontCost,
    paybackMonths,
    revenueMix,
    capacity,
    subscribersAtExit: last.totalSubscribers,
    waitlistAtExit: capacity.reduce((s, c) => s + c.waitlist, 0),
    funnel,
  }
}
