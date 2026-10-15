/**
 * SliceLive simulation engine.
 *
 * Pure, deterministic functions for the three simulated systems behind the demo:
 *  1. Live network: standard network vs. a guaranteed slice under a crowd surge
 *  2. Booking: demand-based pricing and a per-site capacity check
 *  3. Business case: 12-month projection, revenue mix, and utilization lift
 *
 * Constants live in ./config.ts. Randomness is seeded (./random.ts), so every
 * run renders the same story.
 */

import {
  ACTIVE_SLICES,
  BOOKING,
  BUSINESS,
  DEVICE_TYPES,
  CAPACITY,
  DEMO,
  PRICING,
  USE_CASE_ORDER,
  USE_CASES,
  VENUES,
  type BusinessAssumptions,
  type DemandBandId,
  type DeviceType,
  type DeviceTypeId,
  type SliceProfile,
  type UseCaseId,
  type Venue,
} from "./config"
import { clamp, gaussian, hashString, noise } from "./random"

const smoothstep = (x: number) => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}

const mean = (values: number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0

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

export interface ActiveSliceRow {
  id: string
  customer: string
  useCase: UseCaseId
  venue: string
  status: "active" | "scheduled"
  guaranteeLatencyMs: number
  latencyMs: number | null
}

export function sampleActiveSlices(
  load: number,
  key: number
): ActiveSliceRow[] {
  return ACTIVE_SLICES.map((s, i) => ({
    id: s.id,
    customer: s.customer,
    useCase: s.useCase,
    venue: s.venue,
    status: s.status,
    guaranteeLatencyMs: s.guaranteeLatencyMs,
    latencyMs:
      s.status === "active"
        ? clamp(
            s.typicalLatencyMs +
              2.5 * load +
              0.9 * gaussian(DEMO.seed, key, 100 + i),
            s.typicalLatencyMs - 3,
            s.guaranteeLatencyMs - 1
          )
        : null,
  }))
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
  slices: ActiveSliceRow[]
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
    slices: sampleActiveSlices(load, key),
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
    slices: sampleActiveSlices(DEMO.idleLoad, 0),
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
// 2. Booking: pricing & capacity
// ===========================================================================

export function getVenue(id: string): Venue {
  return VENUES.find((v) => v.id === id) ?? VENUES[0]
}

/** Day of week (0 = Sunday) for an ISO date, independent of time zone */
export function weekdayOf(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay()
}

export function isWeekend(dateISO: string) {
  const day = weekdayOf(dateISO)
  return day === 0 || day === 6
}

export function demandBand(hour: number): DemandBandId {
  const h = ((hour % 24) + 24) % 24
  if (h >= PRICING.peakHours[0] && h < PRICING.peakHours[1]) return "peak"
  if (h >= PRICING.standardHours[0] && h < PRICING.standardHours[1])
    return "standard"
  return "off-peak"
}

/** Share (0-1) of a site's sliceable capacity already reserved by other customers */
export function existingReserved(venue: Venue, dateISO: string, hour: number) {
  const weekend = isWeekend(dateISO) ? CAPACITY.weekendFactor : 1
  const base = venue.busyHourReserved * CAPACITY.hourShape[hour % 24] * weekend
  const jitter =
    (noise(hashString(`${venue.id}|${dateISO}`), hour) - 0.5) *
    2 *
    CAPACITY.noise
  return clamp(base + jitter, 0.02, 0.92)
}

/** Price multiplier for a slice profile relative to the reference profile */
export function profileMultiplier(profile: SliceProfile) {
  const ref = PRICING.reference
  return (
    (profile.throughputMbps / ref.throughputMbps) **
      PRICING.throughputExponent *
    (ref.maxLatencyMs / profile.maxLatencyMs) ** PRICING.latencyExponent *
    PRICING.reliabilityMultiplier[profile.reliability]
  )
}

/** Demand multiplier for one hour: time-of-day band x weekend x scarcity */
export function demandMultiplier(
  hour: number,
  dateISO: string,
  reserved: number
) {
  const band = PRICING.demandBands[demandBand(hour)].multiplier
  const weekend = isWeekend(dateISO) ? PRICING.weekendMultiplier : 1
  const scarcity =
    1 +
    PRICING.scarcitySlope * Math.max(0, reserved - PRICING.scarcityThreshold)
  return band * weekend * scarcity
}

export interface BookingRequest {
  venueId: string
  dateISO: string
  startHour: number
  durationHours: number
  useCase: UseCaseId
  profile: SliceProfile
}

export interface HourQuote {
  hour: number
  band: DemandBandId
  demandMultiplier: number
  existingReserved: number
  totalReserved: number
  price: number
}

export interface Quote {
  hours: HourQuote[]
  profileMultiplier: number
  avgDemandMultiplier: number
  subtotal: number
  total: number
  /** Share of capacity this request needs on its own */
  requestShare: number
  /** Busiest-hour reservation before and after this booking */
  peakExisting: number
  peakTotal: number
  oversold: boolean
  /** Largest throughput that would still fit in every hour of the window */
  maxThroughputMbps: number
}

export function quoteBooking(req: BookingRequest): Quote {
  const venue = getVenue(req.venueId)
  const pMult = profileMultiplier(req.profile)
  const requestShare = req.profile.throughputMbps / venue.sliceableCapacityMbps

  const hours: HourQuote[] = []
  for (let i = 0; i < req.durationHours; i++) {
    const hour = req.startHour + i
    const reserved = existingReserved(venue, req.dateISO, hour)
    const dMult = demandMultiplier(hour, req.dateISO, reserved)
    hours.push({
      hour,
      band: demandBand(hour),
      demandMultiplier: dMult,
      existingReserved: reserved,
      totalReserved: reserved + requestShare,
      price: PRICING.baseHourlyRate * dMult * pMult,
    })
  }

  const subtotal = hours.reduce((sum, h) => sum + h.price, 0)
  const peakExisting = Math.max(...hours.map((h) => h.existingReserved))
  const peakTotal = peakExisting + requestShare
  const step = 5
  const maxThroughputMbps = Math.max(
    0,
    Math.floor(
      ((CAPACITY.maxReservable - peakExisting) * venue.sliceableCapacityMbps) /
        step
    ) * step
  )

  return {
    hours,
    profileMultiplier: pMult,
    avgDemandMultiplier: mean(hours.map((h) => h.demandMultiplier)),
    subtotal,
    total: Math.max(PRICING.minimumCharge, subtotal),
    requestShare,
    peakExisting,
    peakTotal,
    oversold: peakTotal > CAPACITY.maxReservable + 1e-9,
    maxThroughputMbps,
  }
}

/** Nearest start time on the same day (same duration) that fits and saves at least 10% */
export function cheaperAlternative(req: BookingRequest, current: Quote) {
  let best: { startHour: number; total: number; savingsPct: number } | null =
    null
  const lastStart = BOOKING.latestEndHour - req.durationHours
  for (let s = BOOKING.earliestStartHour; s <= lastStart; s++) {
    if (s === req.startHour) continue
    const q = quoteBooking({ ...req, startHour: s })
    if (q.oversold) continue
    const savingsPct = 1 - q.total / current.total
    const closer =
      !best ||
      Math.abs(s - req.startHour) < Math.abs(best.startHour - req.startHour)
    if (savingsPct >= 0.1 && closer) {
      best = { startHour: s, total: q.total, savingsPct }
    }
  }
  return best
}

/** Nearest start time on the same day (same duration) that doesn't oversell the site */
export function availableAlternative(req: BookingRequest) {
  let best: { startHour: number; total: number } | null = null
  const lastStart = BOOKING.latestEndHour - req.durationHours
  for (let s = BOOKING.earliestStartHour; s <= lastStart; s++) {
    if (s === req.startHour) continue
    const q = quoteBooking({ ...req, startHour: s })
    if (q.oversold) continue
    if (
      !best ||
      Math.abs(s - req.startHour) < Math.abs(best.startHour - req.startHour)
    ) {
      best = { startHour: s, total: q.total }
    }
  }
  return best
}

export type CheckStatus = "pass" | "warn" | "fail"

export interface EligibilityResult {
  id: "coverage" | "device"
  title: string
  status: CheckStatus
  detail: string
  /** A concrete way forward when the check fails */
  fix?: { label: string; venueId?: string; deviceId?: DeviceTypeId }
}

/** Simulated eligibility checks for a venue and device type */
export function checkEligibility(
  venueId: string,
  deviceId: DeviceTypeId
): EligibilityResult[] {
  const venue = getVenue(venueId)
  const device = getDevice(deviceId)
  const alt = venue.alternativeVenueId
    ? getVenue(venue.alternativeVenueId)
    : null
  return [
    {
      id: "coverage",
      title: "Standalone 5G coverage at this site",
      status:
        venue.saCoverage === "full"
          ? "pass"
          : venue.saCoverage === "partial"
            ? "warn"
            : "fail",
      detail: venue.coverageNote,
      fix: alt
        ? { label: `Switch to ${alt.name}`, venueId: alt.id }
        : undefined,
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

export function getDevice(id: DeviceTypeId): DeviceType {
  return DEVICE_TYPES.find((d) => d.id === id) ?? DEVICE_TYPES[0]
}

export function bookingReference(req: BookingRequest) {
  const h = hashString(JSON.stringify(req)).toString(36).toUpperCase()
  return `SL-${h.slice(0, 6).padEnd(6, "0")}`
}

// ===========================================================================
// 3. Business case
// ===========================================================================

export interface MonthProjection {
  month: number
  label: string
  bookings: number
  revenue: number
  cumulativeNet: number
}

export interface UseCaseRevenue {
  id: UseCaseId
  label: string
  value: number
  share: number
}

export interface UtilizationPoint {
  hour: number
  label: string
  before: number
  after: number
}

export interface BusinessProjection {
  months: MonthProjection[]
  annualRevenue: number
  annualBookings: number
  upfrontCost: number
  steadyStateMonthlyRevenue: number
  effectivePrice: number
  paybackMonths: number | null
  revenueByUseCase: UseCaseRevenue[]
  utilization: UtilizationPoint[]
  avgUtilizationBefore: number
  avgUtilizationAfter: number
  utilizationLiftPts: number
  utilizationLiftPct: number
  nonPeakLiftPts: number
  peakLiftPts: number
  funnel: FunnelStage[]
}

export function hourLabel(hour: number) {
  const h = ((hour % 24) + 24) % 24
  const suffix = h < 12 ? "AM" : "PM"
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display} ${suffix}`
}

export interface FunnelStage {
  stage: string
  description: string
  customers: number
}

/** Monthly bookings per site once off-peak discounts attract extra demand */
export function effectiveBookingsPerSite(a: BusinessAssumptions) {
  return (
    a.bookingsPerSitePerMonth *
    (1 + a.offPeakShare * BUSINESS.offPeakDemandUplift)
  )
}

/** Effective price per hour once off-peak discounts are applied */
export function effectiveHourlyPrice(a: BusinessAssumptions) {
  return a.pricePerHour * (1 - a.offPeakShare * BUSINESS.offPeakDiscount)
}

export function projectBusiness(a: BusinessAssumptions): BusinessProjection {
  const upfrontCost =
    BUSINESS.platformCost + BUSINESS.perSiteCost * a.numberOfSites
  const netShare = 1 - BUSINESS.operatingCostShare
  const price = effectiveHourlyPrice(a)
  const bookingsPerSite = effectiveBookingsPerSite(a)

  let cumulative = -upfrontCost
  const months: MonthProjection[] = []
  for (let m = 1; m <= BUSINESS.months; m++) {
    const adoption =
      BUSINESS.adoptionStart +
      (1 - BUSINESS.adoptionStart) * smoothstep((m - 1) / (BUSINESS.months - 1))
    const bookings = Math.round(bookingsPerSite * a.numberOfSites * adoption)
    const revenue = bookings * a.hoursPerBooking * price
    cumulative += revenue * netShare
    months.push({
      month: m,
      label: `M${m}`,
      bookings,
      revenue,
      cumulativeNet: cumulative,
    })
  }

  const annualRevenue = months.reduce((s, m) => s + m.revenue, 0)
  const annualBookings = months.reduce((s, m) => s + m.bookings, 0)
  const steadyStateMonthlyRevenue =
    bookingsPerSite * a.numberOfSites * a.hoursPerBooking * price

  // Payback: first month cumulative net turns positive, extrapolated past month 12.
  let paybackMonths: number | null = null
  const hit = months.find((m) => m.cumulativeNet >= 0)
  if (hit) {
    paybackMonths = hit.month
  } else {
    const lastNet = months[months.length - 1].revenue * netShare
    if (lastNet > 0)
      paybackMonths = BUSINESS.months + Math.ceil(-cumulative / lastNet)
  }

  // Revenue mix: booking share weighted by each use case's relative price and length.
  const weights = USE_CASE_ORDER.map((id) => {
    const uc = USE_CASES[id]
    return (
      BUSINESS.useCaseMix[id] *
      profileMultiplier(uc.recommended) *
      uc.typicalHours
    )
  })
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  const revenueByUseCase = USE_CASE_ORDER.map((id, i) => ({
    id,
    label: USE_CASES[id].label,
    share: weights[i] / totalWeight,
    value: (annualRevenue * weights[i]) / totalWeight,
  }))

  // Utilization: steady-state slice-hours per site per day. The off-peak share
  // goes to hours outside peak pricing, the rest to peak hours. Within each group,
  // hours are weighted by event demand x headroom left on the cell.
  const dailySliceHours =
    (bookingsPerSite * a.hoursPerBooking) / BUSINESS.daysPerMonth
  const isPeak = (h: number) => demandBand(h) === "peak"
  const baseWeight = BUSINESS.eventPropensity.map(
    (p, h) =>
      p *
      Math.max(
        0,
        (BUSINESS.utilizationCap - BUSINESS.baselineUtilization[h]) /
          BUSINESS.utilizationCap
      )
  )
  const peakSum = baseWeight.reduce((s, w, h) => s + (isPeak(h) ? w : 0), 0)
  const offSum = baseWeight.reduce((s, w, h) => s + (isPeak(h) ? 0 : w), 0)
  const utilization = BUSINESS.baselineUtilization.map((before, hour) => {
    const groupShare = isPeak(hour) ? 1 - a.offPeakShare : a.offPeakShare
    const groupSum = isPeak(hour) ? peakSum : offSum
    const concurrentSlices = groupSum
      ? (dailySliceHours * groupShare * baseWeight[hour]) / groupSum
      : 0
    const added = concurrentSlices * BUSINESS.avgSliceCapacityShare * 100
    return {
      hour,
      label: hourLabel(hour),
      before,
      after: Math.min(
        BUSINESS.utilizationCap,
        Math.max(before, before + added)
      ),
    }
  })

  const avgUtilizationBefore = mean(utilization.map((u) => u.before))
  const avgUtilizationAfter = mean(utilization.map((u) => u.after))
  const nonPeak = utilization.filter((u) => !isPeak(u.hour))

  // Funnel: unique first-time customers through to enterprise upgrade leads.
  const f = BUSINESS.funnel
  const firstTime = Math.round(annualBookings / f.bookingsPerCustomer)
  const repeat = Math.round(firstTime * f.repeatRate)
  const recurring = Math.round(repeat * f.recurringRate)
  const upgrade = Math.round(recurring * f.enterpriseUpgradeRate)
  const funnel: FunnelStage[] = [
    {
      stage: "First booking",
      description: "Unique customers who book once",
      customers: firstTime,
    },
    {
      stage: "Repeat booking",
      description: "Book again within the year",
      customers: repeat,
    },
    {
      stage: "Recurring / multi-site",
      description: "Regular schedule or several venues",
      customers: recurring,
    },
    {
      stage: "Enterprise upgrade",
      description: "Referred to an enterprise slicing contract",
      customers: upgrade,
    },
  ]

  return {
    months,
    annualRevenue,
    annualBookings,
    upfrontCost,
    steadyStateMonthlyRevenue,
    effectivePrice: price,
    paybackMonths,
    revenueByUseCase,
    utilization,
    avgUtilizationBefore,
    avgUtilizationAfter,
    utilizationLiftPts: avgUtilizationAfter - avgUtilizationBefore,
    utilizationLiftPct:
      (avgUtilizationAfter - avgUtilizationBefore) / avgUtilizationBefore,
    nonPeakLiftPts: mean(nonPeak.map((u) => u.after - u.before)),
    peakLiftPts: mean(
      utilization.filter((u) => isPeak(u.hour)).map((u) => u.after - u.before)
    ),
    funnel,
  }
}
