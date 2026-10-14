# SliceLive (concept demo)

**Guaranteed 5G, booked in a minute.** SliceLive is a student concept for a self-serve marketplace where customers book guaranteed-quality 5G network slices by the hour.

Built for the **NJIT Verizon Smart Campus Competition**, pillar **Next-Gen Products & Services**.

> Student concept for NJIT Verizon Smart Campus Competition. All data simulated. Not affiliated with Verizon.
> Nothing in this app talks to a real network. Every number comes from a seeded simulation that runs in the browser.

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run build`     | Production build (all routes static) |
| `npm start`         | Serve the production build           |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | TypeScript, no emit                  |
| `npm run format`    | Prettier                             |

## Pages

| Route           | What it shows                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Hero, three customer scenarios with live-computed prices, a 4-step "How it works" strip, and the business value                                                                                          |
| `/book`         | 3-step wizard: details → recommended slice with sliders, a live demand-priced quote, and a capacity bar that blocks overselling → review and "Slice scheduled"                                           |
| `/demo`         | The centerpiece: "Start crowd surge" ramps load over 30 s. Live latency and throughput charts (slice in red, standard in gray), KPI cards, SLA status, uptime, an active-slices table, and surge results |
| `/business`     | Editable assumptions panel → 12-month revenue/bookings bars, revenue-by-use-case donut, utilization before/after by hour, and summary KPIs (annual revenue, utilization lift, payback)                   |
| `/architecture` | Flow diagram from customer app to the 5G core and monitoring (provisioning labeled "simulated"), plus privacy and security notes                                                                         |

## Project structure

```
app/                      Routes (App Router). Pages are server components.
  layout.tsx              Header, footer, skip link, Inter font
  loading.tsx             Route-level skeleton
  book/ demo/ business/ architecture/
components/
  kpi-card.tsx            KpiCard
  chart-card.tsx          ChartCard + ChartLegend
  step-wizard.tsx         StepWizard (step indicator, focus management)
  slice-badge.tsx         SliceBadge (Active / Scheduled / Guarantee met / breached)
  charts/                 Chart palette + shared tooltip
  layout/                 Header, footer, wordmark, container, page header
  book/ demo/ business/ architecture/   Page-specific pieces
  ui/                     Button, Select, Field, Skeleton
hooks/use-surge-simulation.ts   Ticks the demo engine on an interval
lib/
  config.ts               ALL simulated constants and assumptions (edit here)
  simulate.ts             Pure simulation engine: network, pricing/capacity, business case
  random.ts               Seeded, stateless randomness (hash-based)
  format.ts               Number/currency/date formatters
```

Interactive sections (booking wizard, live demo, business dashboard) are client-only and load behind skeletons via `next/dynamic`.

## How the simulation works

`lib/simulate.ts` is pure and deterministic. Random values come from hashing a seed with a sample index (`lib/random.ts`), so the demo plays out the same way on every run. Each crowd surge is keyed to ticks since the surge started, so "Run surge again" replays it identically.

### Live network (`/demo`)

- **Load curve:** idle at 18%, then a smoothstep ramp to 100% over 30 s, an 8 s hold, and a 12 s recovery (50 s total). Ticks every 500 ms, and the charts show a rolling 60 s window.
- **Standard network latency** = 25 ms + (185 − 25) × load³ + Gaussian jitter (SD 2 ms idle → 22 ms at peak). There's an extra chance of a 25–70 ms spike (10% × load²). Typical peak is 160–260 ms.
- **Standard throughput** = 120 Mbps × (1 − 0.94 × load^1.6) ± 6%, floored at 6 Mbps.
- **Standard packet loss** = 0.1% + (6% − 0.1%) × load⁴ + noise.
- **Slice latency** = 21 ms + 4 ms × load ± 1.2 ms, clamped to 17–28 ms (guarantee ≤ 30 ms).
- **Slice throughput** = 54 Mbps ± 1.2, clamped to 50.5–58 Mbps (guarantee ≥ 50 Mbps).
- **Slice packet loss** about 0.012–0.028%.
- **SLA "Guarantee met"** means latency ≤ 30 ms **and** throughput ≥ 50 Mbps. The standard network is checked against the same thresholds, shown as "Would meet / Would breach".
- **Uptime** = share of samples in the last 60 s that were usable (latency ≤ 100 ms and loss ≤ 2%).
- **Devices on cell** = load × 12,000.
- **Active slices table:** 5 fictional customers (`ACTIVE_SLICES` in config). Each one's latency stays below its own guarantee.

### Pricing (`/book`, landing page)

`price per hour = base rate × demand multiplier × profile multiplier`, summed over each hour in the window. The minimum charge is $15.

- **Base rate:** $40/hr for the reference profile (50 Mbps, 30 ms, 99.9%).
- **Demand multiplier** = time band × weekend × scarcity:
  - Time bands: off-peak ×0.7 (10 PM–7 AM), standard ×1.0 (7 AM–4 PM), peak ×1.5 (4–10 PM)
  - Weekend: ×1.15
  - Scarcity: × (1 + 0.8 × max(0, already-reserved − 60%))
- **Profile multiplier** = (Mbps / 50)^0.7 × (30 / ms)^0.4 × reliability factor (99% → 0.85, 99.9% → 1.0, 99.99% → 1.4).
- **Cheaper-time tip:** suggests the nearest start time on the same day that fits capacity and saves at least 10%.

### Capacity check (`/book`)

- Each venue has a sliceable capacity (400–1,500 Mbps) and a busy-hour reserved share (40–72%).
- **Existing reservations** per hour = busy-hour share × hourly shape curve × 1.12 on weekends ± 6% seeded noise.
- **This booking's share** = requested Mbps ÷ venue capacity.
- A booking is **blocked** if any hour in the window would exceed **85%** reserved. The UI then offers the largest throughput that still fits.

### Business case (`/business`)

Editable **assumptions** (defaults): price per slice-hour **$55**, bookings per site per month **40**, hours per booking **4**, sites **25**.

Fixed assumptions (in `BUSINESS` in `lib/config.ts`):

| Assumption                   | Value                                                                   |
| ---------------------------- | ----------------------------------------------------------------------- |
| Adoption ramp                | 25% of steady-state bookings in month 1 → 100% by month 12 (smoothstep) |
| Platform build (one-time)    | $600,000                                                                |
| Onboarding per site          | $12,000                                                                 |
| Operating cost               | 30% of revenue                                                          |
| Booking mix                  | Livestream 35%, food trucks 30%, esports 15%, event ops 20%             |
| Avg slice size               | 12% of a site's capacity                                                |
| Price elasticity             | 1.5 (shifts bookings toward cheaper hours)                              |
| Baseline utilization by hour | 24-hour curve, 10% overnight → 82% at 7 PM                              |
| Utilization cap              | 90%                                                                     |

Derived outputs:

- **Monthly revenue** = bookings × hours × price. **Annual revenue** = sum of months 1–12.
- **Payback** = first month where cumulative net (revenue × 70% − up-front cost) is ≥ 0. If that's past month 12, it's extrapolated at the month-12 run rate.
- **Revenue by use case** = booking mix × each use case's profile multiplier × typical hours, normalized.
- **Utilization after** = baseline + slice load spread across hours by event propensity × price incentive × available headroom. Lift is reported as the average across all hours and as off-peak vs. peak.

At the defaults, this gives about **$1.65M** year-one revenue, **+2.7 pts** average utilization (5.8% relative), and an **11-month** payback.

### Venues and use cases

The six venues are campus-style and fictional (Campus Green & Quad, Athletics Stadium, Student Center Ballroom, Esports Arena, Food Truck Row (Lot B), Innovation Hall Atrium).

Recommended profiles for each use case:

| Use case            | Throughput | Max latency | Reliability | Typical hours |
| ------------------- | ---------- | ----------- | ----------- | ------------- |
| Livestream crew     | 50 Mbps    | 30 ms       | 99.9%       | 4             |
| Food truck row      | 10 Mbps    | 50 ms       | 99.99%      | 6             |
| Hackathon / esports | 100 Mbps   | 20 ms       | 99.9%       | 6             |
| Event operations    | 30 Mbps    | 40 ms       | 99.9%       | 5             |

## Design notes

- Verizon-inspired palette: red `#EE0000` (CTAs, key metrics, the slice series), black, white, grays `#F6F6F6` / `#D8DADA` / `#747676`. Small muted text uses `#626464` so it passes WCAG AA on light-gray backgrounds.
- No Verizon logo, just a text wordmark with a "Concept demo" tag.
- Charts: red = slice, gray = standard network. Every chart has labeled axes with units, tooltips, a legend, and an `aria-label` summary. The donut also has direct labels with values.
- Accessibility: skip link, visible focus rings, native form controls, `aria-current` in the nav and wizard, and status pills that always pair an icon with text. Reduced-motion preferences are respected.
