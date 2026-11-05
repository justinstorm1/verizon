/**
 * Priority 5G configuration: every simulated constant and business assumption
 * lives here so the demo can be re-tuned without touching UI code.
 * All values are illustrative and simulated. None come from a real network.
 */

// ---------------------------------------------------------------------------
// Plans (illustrative, not real products)
// ---------------------------------------------------------------------------

export type PlanId = "individual" | "family" | "small-business" | "organization"

export type Reliability = 99.9 | 99.99

export interface Plan {
  id: PlanId
  name: string
  audience: string
  tagline: string
  /** Base monthly price, USD */
  price: number
  /** Lines (Family) or devices (business plans) included */
  devices: { count: number; label: string }
  /** Everyday guaranteed floor outside boosts, Mbps (0 = priority only) */
  floorMbps: number
  /** Guarantee during a boost at the Standard speed tier */
  boost: {
    throughputMbps: number
    maxLatencyMs: number
    reliability: Reliability
  }
  /** Boost hours included each month */
  boostHours: number
  /** Price of each extra boost hour, USD */
  extraHourPrice: number
  /** Expected share of subscribers boosting at the same time at peak */
  peakConcurrency: number
  /** This segment's share of each cell's guaranteed pool (its own slice) */
  poolShare: number
  examples: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  individual: {
    id: "individual",
    name: "Individual",
    audience: "Individuals",
    tagline: "Your phone stays fast in a packed lecture hall or stadium.",
    price: 12,
    devices: { count: 1, label: "1 line" },
    floorMbps: 0,
    boost: { throughputMbps: 25, maxLatencyMs: 40, reliability: 99.9 },
    boostHours: 5,
    extraHourPrice: 1.5,
    peakConcurrency: 0.04,
    poolShare: 0.2,
    examples: [
      "Students and commuters",
      "Faculty and staff",
      "Remote exams and video calls",
    ],
  },
  family: {
    id: "family",
    name: "Family",
    audience: "Families",
    tagline: "Shared boost hours for every line in the household.",
    price: 35,
    devices: { count: 5, label: "Up to 5 lines" },
    floorMbps: 2,
    boost: { throughputMbps: 50, maxLatencyMs: 40, reliability: 99.9 },
    boostHours: 15,
    extraHourPrice: 1.5,
    peakConcurrency: 0.06,
    poolShare: 0.15,
    examples: [
      "Families of on-campus students",
      "Households near campus",
      "Game days and move-in weekends",
    ],
  },
  "small-business": {
    id: "small-business",
    name: "Small business",
    audience: "Small businesses",
    tagline:
      "Card readers and order tablets that keep working through the rush.",
    price: 59,
    devices: { count: 10, label: "Up to 10 devices" },
    floorMbps: 5,
    boost: { throughputMbps: 25, maxLatencyMs: 30, reliability: 99.99 },
    boostHours: 30,
    extraHourPrice: 2,
    peakConcurrency: 0.1,
    poolShare: 0.25,
    examples: ["Food trucks", "Campus-area shops and cafés", "Pop-up sellers"],
  },
  organization: {
    id: "organization",
    name: "Organization",
    audience: "Organizations",
    tagline: "Low, steady latency for streams, tournaments, and event staff.",
    price: 149,
    devices: { count: 25, label: "Up to 25 devices" },
    floorMbps: 10,
    boost: { throughputMbps: 100, maxLatencyMs: 20, reliability: 99.9 },
    boostHours: 60,
    extraHourPrice: 3,
    peakConcurrency: 0.1,
    poolShare: 0.4,
    examples: [
      "Student orgs and campus media",
      "Esports and hackathon teams",
      "Event and safety staff",
    ],
  },
}

export const PLAN_ORDER: PlanId[] = [
  "individual",
  "family",
  "small-business",
  "organization",
]

export type SpeedTierId = "standard" | "fast" | "max"

export interface SpeedTier {
  id: SpeedTierId
  name: string
  /** Boost throughput multiplier */
  throughputMultiplier: number
  /** Boost latency reduction, ms (never below 15 ms) */
  latencyReductionMs: number
  /** Monthly price uplift as a share of the plan's base price */
  priceUplift: number
}

/** Upgrade for more speed: a higher boost tier, billed monthly */
export const SPEED_TIERS: Record<SpeedTierId, SpeedTier> = {
  standard: {
    id: "standard",
    name: "Standard",
    throughputMultiplier: 1,
    latencyReductionMs: 0,
    priceUplift: 0,
  },
  fast: {
    id: "fast",
    name: "Fast",
    throughputMultiplier: 2,
    latencyReductionMs: 5,
    priceUplift: 0.4,
  },
  max: {
    id: "max",
    name: "Max",
    throughputMultiplier: 4,
    latencyReductionMs: 10,
    priceUplift: 1,
  },
}

export const SPEED_TIER_ORDER: SpeedTierId[] = ["standard", "fast", "max"]

/** Upgrade for more time: extra boost hours */
export const EXTRA_HOURS = {
  /** Monthly add-on hours selectable at sign-up */
  monthly: { min: 0, max: 50, step: 5 },
  /** One-time top-up packs offered on the account page */
  topUpPacks: [5, 10, 25],
}

export const MIN_LATENCY_MS = 15

// ---------------------------------------------------------------------------
// Capacity: the guardrails that keep subscriptions from becoming normal 5G
// ---------------------------------------------------------------------------

export const CAPACITY = {
  /**
   * Share of each cell's capacity that guarantees may ever use. The rest is
   * always left for regular (best-effort) traffic.
   */
  guaranteedPoolCap: 0.35,
  /** Relative busyness of each hour (0 = midnight); 1.0 is the busy hour */
  hourShape: [
    0.12, 0.08, 0.06, 0.05, 0.05, 0.08, 0.15, 0.25, 0.38, 0.45, 0.5, 0.55, 0.6,
    0.58, 0.55, 0.6, 0.72, 0.85, 0.95, 1.0, 0.92, 0.75, 0.5, 0.28,
  ],
  /** +/- random variation applied per cell, segment, and hour */
  noise: 0.08,
}

// ---------------------------------------------------------------------------
// Campus cells (fictional)
// ---------------------------------------------------------------------------

export interface Cell {
  id: string
  name: string
  kind: string
  /** Total site capacity across sectors, Mbps */
  capacityMbps: number
  /** Typical share of each segment's subscription seats already sold (0-1+) */
  demand: number
  /** Share of the guaranteed pool in use by boosts at the busiest hour */
  busyHourBoostUse: number
  /** Simulated standalone (SA) 5G coverage */
  saCoverage: "full" | "partial" | "none"
  coverageNote: string
  /** Suggested cell when this one isn't eligible */
  alternativeCellId?: string
}

export const CELLS: Cell[] = [
  {
    id: "campus-green",
    name: "Campus Green & Quad",
    kind: "Outdoor lawn and walkways",
    capacityMbps: 3000,
    demand: 0.55,
    busyHourBoostUse: 0.7,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage across the lawn.",
  },
  {
    id: "stadium",
    name: "Athletics Stadium",
    kind: "Stadium, 6,000 seats",
    capacityMbps: 6000,
    demand: 0.98,
    busyHourBoostUse: 1.02,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage in the bowl and concourse.",
  },
  {
    id: "student-center",
    name: "Student Center",
    kind: "Dining, lounges, ballroom",
    capacityMbps: 2400,
    demand: 0.75,
    busyHourBoostUse: 0.8,
    saCoverage: "partial",
    coverageNote:
      "Standalone 5G covers the main floor; the mezzanine falls back to non-standalone 5G.",
  },
  {
    id: "residence-halls",
    name: "Residence Halls",
    kind: "On-campus housing",
    capacityMbps: 4000,
    demand: 0.85,
    busyHourBoostUse: 0.88,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage in all towers.",
  },
  {
    id: "food-truck-row",
    name: "Food Truck Row (Lot B)",
    kind: "Parking lot, vendor row",
    capacityMbps: 1600,
    demand: 0.5,
    busyHourBoostUse: 0.65,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage along the vendor row.",
  },
  {
    id: "innovation-hall",
    name: "Innovation Hall",
    kind: "Labs, maker space, demo floor",
    capacityMbps: 2800,
    demand: 0.6,
    busyHourBoostUse: 0.6,
    saCoverage: "full",
    coverageNote: "Full standalone 5G coverage on every floor.",
  },
  {
    id: "library-lower",
    name: "Library Lower Level",
    kind: "Below-grade study hall",
    capacityMbps: 1200,
    demand: 0.3,
    busyHourBoostUse: 0.3,
    saCoverage: "none",
    coverageNote:
      "No standalone 5G coverage below grade yet, so guarantees aren't available here.",
    alternativeCellId: "student-center",
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
    message: "Standalone-capable phones join the priority slice directly.",
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
      "Supported if the encoder's modems run standalone-capable firmware. Check before relying on it.",
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

/** "What if everyone subscribes?" explorer on the demo page */
export const DENSITY = {
  /** Cell load during the surge the explorer assumes */
  surgeLoad: 0.95,
  /** Priority-class latency = base + span x (priority load)^3 */
  priorityBaseMs: 21,
  prioritySpanMs: 164,
  /** Regular traffic gets slower as more load is prioritized ahead of it */
  standardPenalty: 0.35,
  /** Default slider position: share of devices on a subscription */
  defaultSubscribedShare: 0.5,
}

export type SubscriberStatus = "boosting" | "priority" | "waitlisted"

export interface SubscriberSeed {
  id: string
  name: string
  plan: PlanId
  cell: string
  status: SubscriberStatus
  /** Typical latency while boosting or on everyday priority, ms */
  typicalLatencyMs: number
  guaranteeLatencyMs: number
}

export const ACTIVE_SUBSCRIBERS: SubscriberSeed[] = [
  {
    id: "P5-1041",
    name: "Campus Radio",
    plan: "organization",
    cell: "Athletics Stadium",
    status: "boosting",
    typicalLatencyMs: 14,
    guaranteeLatencyMs: 20,
  },
  {
    id: "P5-1043",
    name: "Lot B Taco Truck",
    plan: "small-business",
    cell: "Food Truck Row (Lot B)",
    status: "boosting",
    typicalLatencyMs: 21,
    guaranteeLatencyMs: 30,
  },
  {
    id: "P5-1047",
    name: "The Rivera family",
    plan: "family",
    cell: "Athletics Stadium",
    status: "boosting",
    typicalLatencyMs: 27,
    guaranteeLatencyMs: 40,
  },
  {
    id: "P5-1050",
    name: "Esports Club",
    plan: "organization",
    cell: "Student Center",
    status: "priority",
    typicalLatencyMs: 24,
    guaranteeLatencyMs: 20,
  },
  {
    id: "P5-1052",
    name: "Jordan (student)",
    plan: "individual",
    cell: "Residence Halls",
    status: "priority",
    typicalLatencyMs: 31,
    guaranteeLatencyMs: 40,
  },
  {
    id: "P5-1055",
    name: "Alex (student)",
    plan: "individual",
    cell: "Athletics Stadium",
    status: "waitlisted",
    typicalLatencyMs: 0,
    guaranteeLatencyMs: 40,
  },
]

// ---------------------------------------------------------------------------
// Business case
// ---------------------------------------------------------------------------

export interface BusinessAssumptions {
  numberOfSites: number
  /** New subscribers who want to sign up per site per month, at full adoption */
  signupsPerSitePerMonth: number
  /** Share of subscribers who cancel each month, 0-1 */
  monthlyChurn: number
  /** Share of subscribers paying for a speed or time upgrade, 0-1 */
  upgradeRate: number
  /** Share of each cell's capacity guarantees may use, 0-1 */
  guaranteedPoolCap: number
}

export const DEFAULT_ASSUMPTIONS: BusinessAssumptions = {
  numberOfSites: 25,
  signupsPerSitePerMonth: 45,
  monthlyChurn: 0.03,
  upgradeRate: 0.25,
  guaranteedPoolCap: CAPACITY.guaranteedPoolCap,
}

export const ASSUMPTION_LIMITS: Record<
  keyof BusinessAssumptions,
  { min: number; max: number; step: number }
> = {
  numberOfSites: { min: 1, max: 100_000, step: 1 },
  signupsPerSitePerMonth: { min: 5, max: 150, step: 5 },
  monthlyChurn: { min: 0, max: 0.15, step: 0.01 },
  upgradeRate: { min: 0, max: 0.8, step: 0.05 },
  guaranteedPoolCap: { min: 0.1, max: 0.6, step: 0.05 },
}

export interface AssumptionPreset {
  id: string
  label: string
  description: string
  assumptions: BusinessAssumptions
}

/** One-click scenarios for the business case. Every value is an assumption. */
export const PRESETS: AssumptionPreset[] = [
  {
    id: "njit-realistic",
    label: "NJIT realistic",
    description: "One campus, ~5% adoption in year one",
    assumptions: {
      numberOfSites: 10,
      signupsPerSitePerMonth: 10,
      monthlyChurn: 0.05,
      upgradeRate: 0.15,
      guaranteedPoolCap: 0.2,
    },
  },
  {
    id: "njit-optimistic",
    label: "NJIT optimistic",
    description: "One campus, strong word of mouth",
    assumptions: {
      numberOfSites: 10,
      signupsPerSitePerMonth: 20,
      monthlyChurn: 0.04,
      upgradeRate: 0.2,
      guaranteedPoolCap: 0.25,
    },
  },
  {
    id: "regional",
    label: "Regional rollout",
    description: "About 8 campuses, realistic rates",
    assumptions: {
      numberOfSites: 80,
      signupsPerSitePerMonth: 10,
      monthlyChurn: 0.05,
      upgradeRate: 0.15,
      guaranteedPoolCap: 0.2,
    },
  },
  {
    id: "nationwide",
    label: "Nationwide (USA)",
    description: "Anyone in the US, 100,000 standalone 5G sites (assumed)",
    assumptions: {
      numberOfSites: 100_000,
      signupsPerSitePerMonth: 5,
      monthlyChurn: 0.05,
      upgradeRate: 0.15,
      guaranteedPoolCap: 0.2,
    },
  },
  {
    id: "aggressive",
    label: "Aggressive",
    description: "The original defaults: high demand, low churn",
    assumptions: DEFAULT_ASSUMPTIONS,
  },
]

export const BUSINESS = {
  months: 12,
  /** Sign-up demand ramps from this share in month 1 to 100% in month 12 */
  adoptionStart: 0.25,
  /** Average cell capacity used to size subscription seats per site, Mbps */
  avgCellCapacityMbps: 3000,
  /** Share of new sign-ups by plan */
  signupMix: {
    individual: 0.45,
    family: 0.2,
    "small-business": 0.2,
    organization: 0.15,
  } satisfies Record<PlanId, number>,
  /** Average monthly upgrade spend of an upgraded subscriber, as a share of base price */
  upgradeSpendShare: 0.45,
  /** How upgrade spend splits between more speed and more time */
  upgradeSplit: { speed: 0.6, time: 0.4 },
  /** One-time platform build (storefront, entitlements, admission control) */
  platformCost: 600_000,
  /** One-time onboarding per site (slice templates, policy config, testing) */
  perSiteCost: 12_000,
  /** Ongoing cost as a share of revenue (support, network cost, payments) */
  operatingCostShare: 0.3,
  /** Funnel conversion assumptions */
  funnel: {
    /** Visitors who start a free first month, per eventual paid subscriber */
    trialToPaid: 0.6,
    /** Organization and business subscribers referred to enterprise slicing per year */
    enterpriseReferralRate: 0.12,
  },
}
