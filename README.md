# SliceLive (concept demo)

**Guaranteed 5G, booked in minutes.** SliceLive is a student concept for a self-serve storefront where small businesses, student orgs, and event organizers book guaranteed-quality 5G network slices by the hour.

**Positioning:** Verizon already builds and sells network slices, mainly through enterprise channels. SliceLive is the self-serve booking layer on top of that portfolio.

Built for the **NJIT Verizon Smart Campus Competition**, pillar **Next-Gen Products & Services**.

> Student concept for the NJIT Verizon Smart Campus Competition. All data simulated. Not affiliated with Verizon.
>
> Nothing in this app talks to a real network. Every number comes from a seeded simulation in the browser or is an explicitly labeled assumption.

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run build`     | Production build (all routes static) |
| `npm start`         | Serve the production build           |
| `npm run lint`      | ESLint                               |
| `npm run typecheck` | TypeScript, no emit                  |
| `npm run format`    | Prettier                             |

## Pages

| Route           | What it shows                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Hero, "The gap" comparison table (enterprise-led today vs. SliceLive), 4 customer scenarios, a 5-step "How it works" (Choose, Check eligibility, Price, Activate, Prove), and a 4-item value strip (new revenue, off-peak utilization, portfolio showcase, upgrade pipeline)                                                                                                                                           |
| `/catalog`      | 4 packages, each labeled "Illustrative profile": Event Priority, Livestream Uplink, Payments Reliability, Safety & Staff Comms. Each shows guaranteed throughput, max latency, reliability target, typical duration, ideal customer, and a simulated price range. "Book this package" opens `/book?package=…`                                                                                                          |
| `/book`         | 4-step wizard: (1) venue, date and time window, use case; (2) eligibility: standalone 5G coverage and device compatibility, with pass / warn / fail states and one-click fixes; (3) recommended profile with sliders, a live demand-priced quote, and "Site capacity reserved: X%". Oversold bookings are blocked and the nearest window that fits is suggested; (4) summary, then "Slice scheduled" with a booking ID |
| `/demo`         | Labeled "Simulated network. Illustrative values." "Start crowd surge" ramps load over 30 s. Latency and throughput charts (slice in red, standard in gray), KPI cards (latency, throughput, packet loss, SLA status, uptime), and an active-slices table                                                                                                                                                               |
| `/business`     | Assumptions panel (price per hour, bookings per site per month, sites, off-peak share, hours per booking), each input tagged "Assumption". Charts: 12-month revenue/bookings bars, revenue-by-use-case donut, utilization before vs. after, and a customer funnel to enterprise upgrade. Summary row: annual revenue, utilization lift, payback, bookings                                                              |
| `/architecture` | Diagram: Customer storefront → Eligibility and capacity engine → Pricing and scheduling → Slice provisioning (simulated; would integrate with the operator's orchestration systems) → 5G standalone core and edge → Monitoring and SLA dashboard. Also a "Security and privacy" note                                                                                                                                   |
| `/pilot`        | 7-week plan for one NJIT campus-event pilot, success metrics with proposed targets, and a risks-and-mitigations table                                                                                                                                                                                                                                                                                                  |

## Project structure

```
app/                         Routes (App Router). Pages are server components.
  layout.tsx                 Header, footer, skip link, Inter font
  loading.tsx                Route-level skeleton
  catalog/ book/ demo/ business/ architecture/ pilot/
components/
  kpi-card.tsx               KpiCard
  chart-card.tsx             ChartCard + ChartLegend
  step-wizard.tsx            StepWizard (step indicator, focus management)
  eligibility-check.tsx      EligibilityCheck (pass / warn / fail list with fixes)
  slice-badge.tsx            SliceBadge (Active / Scheduled / Guarantee met / breached)
  simulated-tag.tsx          "Simulated network. Illustrative values." tag
  charts/                    Chart palette + shared tooltip
  layout/                    Header, footer, wordmark, container, page header
  book/ demo/ business/ architecture/   Page-specific pieces
  ui/                        Button, Select, Field, Skeleton
hooks/use-surge-simulation.ts   Ticks the demo engine on an interval
lib/
  config.ts                  ALL simulated constants and assumptions (edit here)
  simulate.ts                Pure engine: network, eligibility, pricing/capacity, business case
  random.ts                  Seeded, stateless randomness (hash-based)
  format.ts                  Number/currency/date formatters
```

The booking wizard, live demo, and business dashboard are client-only and load behind skeletons via `next/dynamic`.

## Every simulated value and assumption

All of these live in `lib/config.ts`. The formulas are in `lib/simulate.ts`.

### Randomness

Values come from hashing a fixed seed (`DEMO.seed = 5150`) with a sample index, so every run is identical. Each crowd surge is keyed to ticks since it started, so "Run surge again" replays exactly.

### Live network (`/demo`)

| Value                | Simulated setting                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Load curve           | Idle 18% → smoothstep ramp to 100% over 30 s → 8 s hold → 12 s recovery (50 s total); 500 ms ticks; 60 s chart window                                            |
| Standard latency     | 25 ms + 160 ms × load³ + jitter (SD 2 ms idle → 22 ms at peak), plus a 25–70 ms spike with probability 10% × load². Typically 160–260 ms at peak                 |
| Standard throughput  | 120 Mbps × (1 − 0.94 × load^1.6) ± 6%, floor 6 Mbps                                                                                                              |
| Standard packet loss | 0.1% + 5.9% × load⁴ + noise                                                                                                                                      |
| Slice latency        | 21 ms + 4 ms × load ± 1.2 ms, clamped to 17–28 ms (guarantee ≤ 30 ms)                                                                                            |
| Slice throughput     | 54 Mbps ± 1.2, clamped to 50.5–58 Mbps (guarantee ≥ 50 Mbps)                                                                                                     |
| Slice packet loss    | 0.012–0.028%                                                                                                                                                     |
| SLA status           | "Guarantee met" when latency ≤ 30 ms **and** throughput ≥ 50 Mbps; turns red ("breached") otherwise. The standard network is checked against the same thresholds |
| Uptime               | Share of samples in the last 60 s with latency ≤ 100 ms and loss ≤ 2%                                                                                            |
| Devices on cell      | load × 12,000                                                                                                                                                    |
| Active slices        | 6 fictional customers (`ACTIVE_SLICES`), each kept below its own latency guarantee                                                                               |

### Catalog packages (illustrative profiles)

| Package              | Throughput | Max latency | Reliability | Typical duration | Ideal customer                          |
| -------------------- | ---------- | ----------- | ----------- | ---------------- | --------------------------------------- |
| Event Priority       | 100 Mbps   | 20 ms       | 99.9%       | 4–10 h           | Hackathons, esports, demo days          |
| Livestream Uplink    | 50 Mbps    | 30 ms       | 99.9%       | 2–6 h            | Student media, campus radio, broadcasts |
| Payments Reliability | 10 Mbps    | 50 ms       | 99.99%      | 4–10 h           | Food trucks, pop-up retail, booths      |
| Safety & Staff Comms | 30 Mbps    | 40 ms       | 99.99%      | 3–12 h           | Organizers, campus safety, staff        |

Use cases map to packages: livestream → Livestream Uplink; food trucks and pop-up retail → Payments Reliability; hackathon/esports → Event Priority; safety & staff comms → Safety & Staff Comms.

### Eligibility (`/book`, step 2)

- **Standalone 5G coverage** per venue: full (pass) for 5 venues; Student Center Ballroom is partial (pass with a note); Library Lower Level has none (fail, with "Switch to Student Center Ballroom").
- **Device compatibility:**
  - SA phone and SA hotspot: pass
  - Bonding encoder: pass with a note (firmware check)
  - Non-standalone 5G phone, LTE phone/tablet, LTE card reader: fail, with "connect through an SA hotspot over Wi-Fi"
- Each use case preselects a typical device (for example, food trucks → LTE card reader), so the check tells a realistic story.
- The check shows a simulated 0.9 s "Checking…" state.

### Pricing

`price per hour = base rate × demand multiplier × profile multiplier`, summed over each hour. Minimum charge $15.

- **Base rate:** $40/hr for the reference profile (50 Mbps, 30 ms, 99.9%).
- **Demand multiplier** = time band × weekend × scarcity:
  - Time bands: off-peak ×0.7 (10 PM–7 AM), standard ×1.0 (7 AM–4 PM), peak ×1.5 (4–10 PM)
  - Weekend: ×1.15
  - Scarcity: × (1 + 0.8 × max(0, reserved − 60%))
- **Profile multiplier** = (Mbps / 50)^0.7 × (30 / ms)^0.4 × reliability factor (99% → 0.85, 99.9% → 1.0, 99.99% → 1.4).
- **Cheaper-time tip:** nearest same-day start that fits capacity and saves at least 10%.

### Capacity

- 7 fictional campus venues with sliceable capacity of 300–1,500 Mbps and a busy-hour reserved share of 30–72%.
- **Existing reservations** per hour = busy-hour share × hourly shape curve × 1.12 on weekends ± 6% seeded noise.
- **Blocked** if any hour in the window would exceed **85%** reserved. The UI then suggests the nearest same-day window that fits, or the largest throughput that fits.

### Business case (`/business`)

Editable assumptions (defaults):

| Assumption                                    | Default |
| --------------------------------------------- | ------- |
| Price per slice-hour (standard rate)          | $55     |
| Bookings per site per month                   | 40      |
| Number of sites                               | 25      |
| Off-peak share (booked hours outside 4–10 PM) | 70%     |
| Hours per booking                             | 4       |

Fixed assumptions:

| Assumption                   | Value                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Off-peak discount            | 30% → effective price = price × (1 − off-peak share × 0.3)                                                                                    |
| Off-peak demand uplift       | bookings × (1 + 0.5 × off-peak share)                                                                                                         |
| Adoption ramp                | 25% of steady state in month 1 → 100% by month 12                                                                                             |
| Platform build (one-time)    | $600,000                                                                                                                                      |
| Onboarding per site          | $12,000                                                                                                                                       |
| Operating cost               | 30% of revenue                                                                                                                                |
| Booking mix                  | Livestream 30%, food trucks 20%, esports 15%, pop-up retail 15%, safety & staff comms 20%                                                     |
| Avg slice size               | 12% of a site's capacity                                                                                                                      |
| Baseline utilization by hour | 24-hour curve, 10% overnight → 82% at 7 PM; cap 90%                                                                                           |
| Funnel                       | 2.5 bookings per customer per year; 45% repeat; 35% of repeaters become recurring or multi-site; 25% of those become enterprise upgrade leads |

Derived outputs:

- **Revenue** = bookings × hours × effective price.
- **Payback** = first month where cumulative net (revenue × 70% − up-front cost) is ≥ 0. If that's past month 12, it's extrapolated at the month-12 run rate.
- **Revenue by use case** = booking mix × the package's profile multiplier × typical hours.
- **Utilization after:** slice-hours are split by the off-peak share between peak and non-peak hours, then weighted by event demand × cell headroom.
- **Funnel** stages are computed from annual bookings.

At the defaults, the model gives about **$1.76M** year-one revenue, a **+3.6 pts** average utilization lift, **10-month** payback, and **160** enterprise upgrade leads a year. All of these are simulated.

### Pilot plan (`/pilot`)

The pilot targets (for example, p95 latency ≤ 30 ms, booking-to-activation under 15 minutes, organizer satisfaction ≥ 4.5/5) are **proposed targets**, not results.

## Content rules followed

- No claims of real network access. Provisioning is labeled simulated everywhere it appears.
- No statistics about real companies. The "Today" column on the landing page describes enterprise-led buying in general terms.
- Packages are labeled "Illustrative profile", scenarios "Illustrative scenario", and every business input "Assumption".

## Design notes

- Verizon-inspired palette: red `#EE0000` (CTAs, key metrics, the slice series), black, white, and grays `#F6F6F6` / `#D8DADA` / `#747676`. Green and amber are used only for status.
  - Small muted text uses `#626464` so it passes WCAG AA on light gray.
  - The 5-color donut palette was checked for colorblind separation and always has direct labels.
- No Verizon logo, just a text wordmark with a "Concept demo" tag.
- Charts: labeled axes with units, tooltips, legends, and an `aria-label` summary on each.
- Accessibility:
  - Skip link, visible focus rings, native form controls, and `aria-current` in the nav and wizard
  - Status always shows an icon plus text
  - Live regions for eligibility results and quotes
  - Reduced-motion preferences are respected
