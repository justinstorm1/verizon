/**
 * SliceLive configuration: every simulated constant and business assumption
 * lives here so the demo can be re-tuned without touching UI code.
 * All values are illustrative and simulated. None come from a real network.
 */

// ---------------------------------------------------------------------------
// Slice profiles & use cases
// ---------------------------------------------------------------------------

export type Reliability = 99 | 99.9 | 99.99

export interface SliceProfile {
  /** Guaranteed downlink throughput for the slice, in Mbps */
  throughputMbps: number
  /** Maximum round-trip latency the slice guarantees, in ms */
  maxLatencyMs: number
  /** Share of time the guarantee must hold, in percent */
  reliability: Reliability
}

export const PROFILE_LIMITS = {
  throughputMbps: { min: 5, max: 300, step: 5 },
  maxLatencyMs: { min: 10, max: 50, step: 5 },
  reliability: [99, 99.9, 99.99] as const satisfies readonly Reliability[],
}

export type UseCaseId = "livestream" | "food-trucks" | "esports" | "event-ops"

export interface UseCase {
  id: UseCaseId
  label: string
  short: string
  description: string
  recommended: SliceProfile
  /** Typical booking length, in hours (used as the default duration) */
  typicalHours: number
  rationale: string
}

export const USE_CASES: Record<UseCaseId, UseCase> = {
  livestream: {
    id: "livestream",
    label: "Livestream crew",
    short: "Livestream",
    description:
      "Multi-camera broadcast of a game, concert, or commencement with stable uplink.",
    recommended: { throughputMbps: 50, maxLatencyMs: 30, reliability: 99.9 },
    typicalHours: 4,
    rationale:
      "Two 1080p60 feeds plus a return monitor need roughly 40 Mbps sustained; 50 Mbps leaves headroom.",
  },
  "food-trucks": {
    id: "food-trucks",
    label: "Food truck row",
    short: "Food trucks",
    description:
      "Card readers and ordering tablets for a row of vendors that cannot drop a payment.",
    recommended: { throughputMbps: 10, maxLatencyMs: 50, reliability: 99.99 },
    typicalHours: 6,
    rationale:
      "Payments need little bandwidth but must almost never fail, so reliability is set to 99.99%.",
  },
  esports: {
    id: "esports",
    label: "Hackathon / esports",
    short: "Esports",
    description:
      "Tournament play and hackathon demos where lag decides the outcome.",
    recommended: { throughputMbps: 100, maxLatencyMs: 20, reliability: 99.9 },
    typicalHours: 6,
    rationale:
      "Competitive play is latency-bound; 20 ms keeps input lag unnoticeable across 40 stations.",
  },
  "event-ops": {
    id: "event-ops",
    label: "Event operations",
    short: "Event ops",
    description:
      "Ticket scanning, staff radios over IP, and safety cameras for large gatherings.",
    recommended: { throughputMbps: 30, maxLatencyMs: 40, reliability: 99.9 },
    typicalHours: 5,
    rationale:
      "A handful of HD cameras and scanners; moderate bandwidth with dependable delivery.",
  },
}

export const USE_CASE_ORDER: UseCaseId[] = [
  "livestream",
  "food-trucks",
  "esports",
  "event-ops",
]

// ---------------------------------------------------------------------------
// Venues & capacity
// ---------------------------------------------------------------------------

export interface Venue {
  id: string
  name: string
  kind: string
  /** Capacity the site can dedicate to slices, in Mbps */
  sliceableCapacityMbps: number
  /** Typical share of sliceable capacity already reserved at the busiest hour */
  busyHourReserved: number
}

export const VENUES: Venue[] = [
  {
    id: "campus-green",
    name: "Campus Green & Quad",
    kind: "Outdoor event lawn",
    sliceableCapacityMbps: 800,
    busyHourReserved: 0.45,
  },
  {
    id: "stadium",
    name: "Athletics Stadium",
    kind: "Stadium, 6,000 seats",
    sliceableCapacityMbps: 1500,
    busyHourReserved: 0.72,
  },
  {
    id: "student-center",
    name: "Student Center Ballroom",
    kind: "Indoor hall",
    sliceableCapacityMbps: 600,
    busyHourReserved: 0.5,
  },
  {
    id: "esports-arena",
    name: "Esports Arena",
    kind: "Gaming venue, 80 stations",
    sliceableCapacityMbps: 1000,
    busyHourReserved: 0.62,
  },
  {
    id: "food-truck-row",
    name: "Food Truck Row (Lot B)",
    kind: "Parking lot, vendor row",
    sliceableCapacityMbps: 400,
    busyHourReserved: 0.4,
  },
  {
    id: "innovation-hall",
    name: "Innovation Hall Atrium",
    kind: "Maker space & demo floor",
    sliceableCapacityMbps: 700,
    busyHourReserved: 0.55,
  },
]

export const CAPACITY = {
  /** Bookings may never push reserved slice capacity above this share */
  maxReservable: 0.85,
  /** Relative busyness of each hour (0 = midnight); 1.0 is the busy hour */
  hourShape: [
    0.12, 0.08, 0.06, 0.05, 0.05, 0.08, 0.15, 0.25, 0.38, 0.45, 0.5, 0.55, 0.6,
    0.58, 0.55, 0.6, 0.72, 0.85, 0.95, 1.0, 0.92, 0.75, 0.5, 0.28,
  ],
  /** Weekend days are busier on campus event venues */
  weekendFactor: 1.12,
  /** +/- random variation applied per venue, date, and hour */
  noise: 0.06,
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export type DemandBandId = "off-peak" | "standard" | "peak"

export const PRICING = {
  currency: "USD",
  /** Price of one hour of the reference profile at a standard-demand hour */
  baseHourlyRate: 40,
  reference: { throughputMbps: 50, maxLatencyMs: 30, reliability: 99.9 },
  demandBands: {
    "off-peak": { label: "Off-peak", multiplier: 0.7 },
    standard: { label: "Standard", multiplier: 1.0 },
    peak: { label: "Peak", multiplier: 1.5 },
  } satisfies Record<DemandBandId, { label: string; multiplier: number }>,
  /** Hours [start, end) that fall in each band; everything else is off-peak */
  peakHours: [16, 22] as const,
  standardHours: [7, 16] as const,
  weekendMultiplier: 1.15,
  /** Scarcity surcharge once a site is already this reserved... */
  scarcityThreshold: 0.6,
  /** ...adding this much multiplier per 100% above the threshold */
  scarcitySlope: 0.8,
  /** Profile multiplier = (Mbps / ref)^a x (ref ms / ms)^b x reliability factor */
  throughputExponent: 0.7,
  latencyExponent: 0.4,
  reliabilityMultiplier: { 99: 0.85, 99.9: 1.0, 99.99: 1.4 } satisfies Record<
    Reliability,
    number
  >,
  /** Smallest charge for any booking */
  minimumCharge: 15,
}

export const BOOKING = {
  earliestStartHour: 6,
  latestEndHour: 24,
  maxDurationHours: 12,
}

// ---------------------------------------------------------------------------
// Live demo: crowd surge simulation
// ---------------------------------------------------------------------------

export const DEMO = {
  seed: 5150,
  tickMs: 500,
  /** Seconds of history visible on the live charts */
  windowSeconds: 60,
  /** Seconds of idle history drawn before the page is interactive */
  prefillSeconds: 24,
  rampSeconds: 30,
  holdSeconds: 8,
  recoverSeconds: 12,
  idleLoad: 0.18,
  peakLoad: 1.0,
  peakDevices: 12000,
  standard: {
    baseLatencyMs: 25,
    peakLatencyMs: 185,
    jitterMs: { idle: 2, peak: 22 },
    spikeChance: 0.1,
    spikeMs: { min: 25, max: 70 },
    idleThroughputMbps: 120,
    minThroughputMbps: 6,
    baseLossPct: 0.1,
    peakLossPct: 6,
  },
  slice: {
    guaranteeLatencyMs: 30,
    typicalLatencyMs: 21,
    loadLatencyMs: 4,
    jitterMs: 1.2,
    guaranteeThroughputMbps: 50,
    typicalThroughputMbps: 54,
    lossPct: 0.02,
  },
  /** A connection counts as "up" when both of these hold */
  usable: { maxLatencyMs: 100, maxLossPct: 2 },
}

export interface ActiveSliceSeed {
  id: string
  customer: string
  useCase: UseCaseId
  venue: string
  guaranteeLatencyMs: number
  typicalLatencyMs: number
  status: "active" | "scheduled"
}

export const ACTIVE_SLICES: ActiveSliceSeed[] = [
  {
    id: "SL-2041",
    customer: "Campus Radio Broadcast",
    useCase: "livestream",
    venue: "Athletics Stadium",
    guaranteeLatencyMs: 30,
    typicalLatencyMs: 22,
    status: "active",
  },
  {
    id: "SL-2043",
    customer: "Lot B Vendors (6 trucks)",
    useCase: "food-trucks",
    venue: "Food Truck Row (Lot B)",
    guaranteeLatencyMs: 50,
    typicalLatencyMs: 31,
    status: "active",
  },
  {
    id: "SL-2047",
    customer: "Spring Hackathon Finals",
    useCase: "esports",
    venue: "Esports Arena",
    guaranteeLatencyMs: 20,
    typicalLatencyMs: 14,
    status: "active",
  },
  {
    id: "SL-2050",
    customer: "Event Safety Team",
    useCase: "event-ops",
    venue: "Athletics Stadium",
    guaranteeLatencyMs: 40,
    typicalLatencyMs: 27,
    status: "active",
  },
  {
    id: "SL-2052",
    customer: "Alumni Concert Stream",
    useCase: "livestream",
    venue: "Campus Green & Quad",
    guaranteeLatencyMs: 30,
    typicalLatencyMs: 22,
    status: "scheduled",
  },
]

// ---------------------------------------------------------------------------
// Business case
// ---------------------------------------------------------------------------

export interface BusinessAssumptions {
  pricePerHour: number
  bookingsPerSitePerMonth: number
  numberOfSites: number
  hoursPerBooking: number
}

export const DEFAULT_ASSUMPTIONS: BusinessAssumptions = {
  pricePerHour: 55,
  bookingsPerSitePerMonth: 40,
  numberOfSites: 25,
  hoursPerBooking: 4,
}

export const ASSUMPTION_LIMITS: Record<
  keyof BusinessAssumptions,
  { min: number; max: number; step: number }
> = {
  pricePerHour: { min: 15, max: 150, step: 5 },
  bookingsPerSitePerMonth: { min: 5, max: 150, step: 5 },
  numberOfSites: { min: 1, max: 100, step: 1 },
  hoursPerBooking: { min: 1, max: 10, step: 0.5 },
}

export const BUSINESS = {
  months: 12,
  /** Adoption ramps from this share of steady-state bookings in month 1 to 100% in month 12 */
  adoptionStart: 0.25,
  /** One-time platform build (pricing engine, portal, integration) */
  platformCost: 600_000,
  /** One-time onboarding per site (edge config, slice templates, testing) */
  perSiteCost: 12_000,
  /** Ongoing cost as a share of revenue (support, network cost, payments) */
  operatingCostShare: 0.3,
  /** Share of bookings by use case */
  useCaseMix: {
    livestream: 0.35,
    "food-trucks": 0.3,
    esports: 0.15,
    "event-ops": 0.2,
  } satisfies Record<UseCaseId, number>,
  /** Average share of a site's sliceable capacity one booking uses */
  avgSliceCapacityShare: 0.12,
  /** How strongly price incentives shift bookings toward cheaper hours */
  priceElasticity: 1.5,
  daysPerMonth: 30,
  /** Typical cell utilization (%) by hour before SliceLive */
  baselineUtilization: [
    18, 14, 12, 10, 10, 12, 20, 32, 45, 52, 56, 60, 64, 62, 60, 62, 68, 74, 80,
    82, 76, 62, 42, 28,
  ],
  /** Relative likelihood an event wants a slice in each hour */
  eventPropensity: [
    0.05, 0.02, 0, 0, 0, 0, 0.1, 0.4, 0.8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.9,
    0.7, 0.4, 0.2,
  ],
  utilizationCap: 90,
}
