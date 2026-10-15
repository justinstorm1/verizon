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

// Catalog packages. Every profile is illustrative, not a real product.
export type PackageId =
  | "event-priority"
  | "livestream-uplink"
  | "payments-reliability"
  | "safety-comms"

export interface SlicePackage {
  id: PackageId
  name: string
  tagline: string
  profile: SliceProfile
  /** Typical booking length range and the default used when booking, in hours */
  typicalHours: { min: number; max: number; default: number }
  idealCustomer: string
  includes: string[]
}

export const PACKAGES: Record<PackageId, SlicePackage> = {
  "event-priority": {
    id: "event-priority",
    name: "Event Priority",
    tagline:
      "Low, steady latency for play and live demos when the venue is packed.",
    profile: { throughputMbps: 100, maxLatencyMs: 20, reliability: 99.9 },
    typicalHours: { min: 4, max: 10, default: 6 },
    idealCustomer: "Hackathons, esports tournaments, demo days",
    includes: [
      "Latency-first scheduling",
      "Up to 40 devices",
      "Live SLA dashboard",
    ],
  },
  "livestream-uplink": {
    id: "livestream-uplink",
    name: "Livestream Uplink",
    tagline:
      "Reserved throughput so multi-camera streams don't drop when the crowd arrives.",
    profile: { throughputMbps: 50, maxLatencyMs: 30, reliability: 99.9 },
    typicalHours: { min: 2, max: 6, default: 4 },
    idealCustomer: "Student media, campus radio, club and athletics broadcasts",
    includes: [
      "Sustained throughput floor",
      "Up to 4 encoders",
      "Live SLA dashboard",
    ],
  },
  "payments-reliability": {
    id: "payments-reliability",
    name: "Payments Reliability",
    tagline:
      "Small, highly reliable slice so card readers keep working through the rush.",
    profile: { throughputMbps: 10, maxLatencyMs: 50, reliability: 99.99 },
    typicalHours: { min: 4, max: 10, default: 6 },
    idealCustomer: "Food trucks, pop-up retail, ticket and merch booths",
    includes: [
      "Highest reliability target",
      "Up to 25 terminals",
      "Live SLA dashboard",
    ],
  },
  "safety-comms": {
    id: "safety-comms",
    name: "Safety & Staff Comms",
    tagline:
      "Dependable capacity for staff radios over IP, scanners, and safety cameras.",
    profile: { throughputMbps: 30, maxLatencyMs: 40, reliability: 99.99 },
    typicalHours: { min: 3, max: 12, default: 5 },
    idealCustomer: "Event organizers, campus safety teams, volunteer staff",
    includes: [
      "Push-to-talk friendly latency",
      "Up to 30 devices",
      "Live SLA dashboard",
    ],
  },
}

export const PACKAGE_ORDER: PackageId[] = [
  "event-priority",
  "livestream-uplink",
  "payments-reliability",
  "safety-comms",
]

export type UseCaseId =
  "livestream" | "food-trucks" | "esports" | "popup-retail" | "safety-comms"

export interface UseCase {
  id: UseCaseId
  label: string
  short: string
  description: string
  packageId: PackageId
  recommended: SliceProfile
  /** Typical booking length, in hours (used as the default duration) */
  typicalHours: number
  rationale: string
}

function defineUseCase(
  u: Omit<UseCase, "recommended" | "typicalHours">
): UseCase {
  const pkg = PACKAGES[u.packageId]
  return {
    ...u,
    recommended: pkg.profile,
    typicalHours: pkg.typicalHours.default,
  }
}

export const USE_CASES: Record<UseCaseId, UseCase> = {
  livestream: defineUseCase({
    id: "livestream",
    label: "Campus event livestream",
    short: "Livestream",
    description: "Multi-camera broadcast of a game, concert, or commencement.",
    packageId: "livestream-uplink",
    rationale:
      "Two 1080p60 feeds plus a return monitor need roughly 40 Mbps sustained; 50 Mbps leaves headroom.",
  }),
  "food-trucks": defineUseCase({
    id: "food-trucks",
    label: "Food truck row payments",
    short: "Food trucks",
    description: "Card readers and ordering tablets for a row of vendors.",
    packageId: "payments-reliability",
    rationale:
      "Payments need little bandwidth but must almost never fail, so reliability is set to 99.99%.",
  }),
  esports: defineUseCase({
    id: "esports",
    label: "Hackathon / esports",
    short: "Esports",
    description:
      "Tournament play and hackathon demos where lag decides the outcome.",
    packageId: "event-priority",
    rationale:
      "Competitive play is latency-bound; 20 ms keeps input lag unnoticeable across 40 stations.",
  }),
  "popup-retail": defineUseCase({
    id: "popup-retail",
    label: "Pop-up retail",
    short: "Pop-up retail",
    description:
      "Weekend markets and merch tables taking cards and mobile orders.",
    packageId: "payments-reliability",
    rationale:
      "Checkout traffic is light but bursty; a small, very reliable slice keeps every sale going through.",
  }),
  "safety-comms": defineUseCase({
    id: "safety-comms",
    label: "Safety & staff comms",
    short: "Staff comms",
    description: "Staff radios over IP, ticket scanners, and safety cameras.",
    packageId: "safety-comms",
    rationale:
      "A few HD cameras plus voice and scanners; moderate bandwidth with mission-critical reliability.",
  }),
}

export const USE_CASE_ORDER: UseCaseId[] = [
  "livestream",
  "food-trucks",
  "esports",
  "popup-retail",
  "safety-comms",
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
  /** Simulated standalone (SA) 5G coverage at the site */
  saCoverage: "full" | "partial" | "none"
  coverageNote: string
  /** Suggested venue when this one isn't eligible */
  alternativeVenueId?: string
}

export const VENUES: Venue[] = [
  {
    id: "campus-green",
    name: "Campus Green & Quad",
    kind: "Outdoor event lawn",
    sliceableCapacityMbps: 800,
    busyHourReserved: 0.45,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage across the lawn.",
  },
  {
    id: "stadium",
    name: "Athletics Stadium",
    kind: "Stadium, 6,000 seats",
    sliceableCapacityMbps: 1500,
    busyHourReserved: 0.72,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage in the bowl and concourse.",
  },
  {
    id: "student-center",
    name: "Student Center Ballroom",
    kind: "Indoor hall",
    sliceableCapacityMbps: 600,
    busyHourReserved: 0.5,
    saCoverage: "partial",
    coverageNote:
      "Standalone 5G covers the main floor; the mezzanine falls back to non-standalone 5G.",
  },
  {
    id: "esports-arena",
    name: "Esports Arena",
    kind: "Gaming venue, 80 stations",
    sliceableCapacityMbps: 1000,
    busyHourReserved: 0.62,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage, including the stage.",
  },
  {
    id: "food-truck-row",
    name: "Food Truck Row (Lot B)",
    kind: "Parking lot, vendor row",
    sliceableCapacityMbps: 400,
    busyHourReserved: 0.4,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage along the vendor row.",
  },
  {
    id: "innovation-hall",
    name: "Innovation Hall Atrium",
    kind: "Maker space & demo floor",
    sliceableCapacityMbps: 700,
    busyHourReserved: 0.55,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage on the demo floor.",
  },
  {
    id: "library-lower",
    name: "Library Lower Level",
    kind: "Below-grade study hall",
    sliceableCapacityMbps: 300,
    busyHourReserved: 0.3,
    saCoverage: "none",
    coverageNote:
      "No standalone 5G coverage below grade yet, so slices can't be guaranteed here.",
    alternativeVenueId: "student-center",
  },
]

// ---------------------------------------------------------------------------
// Eligibility: device types (simulated compatibility rules)
// ---------------------------------------------------------------------------

export type DeviceTypeId =
  | "sa-phone"
  | "sa-hotspot"
  | "bonded-encoder"
  | "nsa-phone"
  | "lte-device"
  | "lte-pos"

export interface DeviceType {
  id: DeviceTypeId
  label: string
  result: "pass" | "warn" | "fail"
  message: string
  /** Device to switch to when this one fails */
  alternativeId?: DeviceTypeId
  alternativeLabel?: string
}

export const DEVICE_TYPES: DeviceType[] = [
  {
    id: "sa-phone",
    label: "5G phone with standalone (SA) support",
    result: "pass",
    message: "Standalone-capable phones can join the slice directly.",
  },
  {
    id: "sa-hotspot",
    label: "SA-capable 5G hotspot or router",
    result: "pass",
    message:
      "The hotspot joins the slice; anything connected to it over Wi-Fi shares the guarantee.",
  },
  {
    id: "bonded-encoder",
    label: "Cellular bonding encoder (livestream)",
    result: "warn",
    message:
      "Supported if the encoder's modems run standalone-capable firmware. Check before the event.",
  },
  {
    id: "nsa-phone",
    label: "Older 5G phone (non-standalone only)",
    result: "fail",
    message:
      "This phone can't attach to a standalone 5G slice, so the guarantee wouldn't apply.",
    alternativeId: "sa-hotspot",
    alternativeLabel: "Connect through an SA hotspot over Wi-Fi",
  },
  {
    id: "lte-device",
    label: "4G LTE phone or tablet",
    result: "fail",
    message: "LTE devices can't use 5G network slices.",
    alternativeId: "sa-hotspot",
    alternativeLabel: "Connect through an SA hotspot over Wi-Fi",
  },
  {
    id: "lte-pos",
    label: "LTE card reader / POS terminal",
    result: "fail",
    message:
      "The reader's built-in LTE modem can't join a slice. Most readers also support Wi-Fi.",
    alternativeId: "sa-hotspot",
    alternativeLabel: "Pair readers to an SA hotspot over Wi-Fi",
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
    useCase: "safety-comms",
    venue: "Athletics Stadium",
    guaranteeLatencyMs: 40,
    typicalLatencyMs: 27,
    status: "active",
  },
  {
    id: "SL-2052",
    customer: "Makers Market Pop-up",
    useCase: "popup-retail",
    venue: "Innovation Hall Atrium",
    guaranteeLatencyMs: 50,
    typicalLatencyMs: 29,
    status: "active",
  },
  {
    id: "SL-2055",
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
  /** Share of booked hours outside peak pricing (before 4 PM or after 10 PM), 0-1 */
  offPeakShare: number
  hoursPerBooking: number
}

export const DEFAULT_ASSUMPTIONS: BusinessAssumptions = {
  pricePerHour: 55,
  bookingsPerSitePerMonth: 40,
  numberOfSites: 25,
  offPeakShare: 0.7,
  hoursPerBooking: 4,
}

export const ASSUMPTION_LIMITS: Record<
  keyof BusinessAssumptions,
  { min: number; max: number; step: number }
> = {
  pricePerHour: { min: 15, max: 150, step: 5 },
  bookingsPerSitePerMonth: { min: 5, max: 150, step: 5 },
  numberOfSites: { min: 1, max: 100, step: 1 },
  offPeakShare: { min: 0, max: 0.9, step: 0.05 },
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
  /** Off-peak hours are discounted by this share versus the standard price */
  offPeakDiscount: 0.3,
  /** Extra bookings the discount attracts: +50% x off-peak share (0.4 share -> +20%) */
  offPeakDemandUplift: 0.5,
  /** Share of bookings by use case */
  useCaseMix: {
    livestream: 0.3,
    "food-trucks": 0.2,
    esports: 0.15,
    "popup-retail": 0.15,
    "safety-comms": 0.2,
  } satisfies Record<UseCaseId, number>,
  /** Average share of a site's sliceable capacity one booking uses */
  avgSliceCapacityShare: 0.12,
  /** Customer funnel: average bookings per customer in year one, then stage conversion rates */
  funnel: {
    bookingsPerCustomer: 2.5,
    repeatRate: 0.45,
    recurringRate: 0.35,
    enterpriseUpgradeRate: 0.25,
  },
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
