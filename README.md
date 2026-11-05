# Priority 5G (concept demo)

**Guaranteed 5G on campus, by subscription.** Priority 5G is a student concept for the **NJIT Verizon Smart Campus Competition** (pillar: Next-Gen Products & Services).

Individuals, families, small businesses, and organizations subscribe monthly. Every plan includes:

- **Everyday priority** over regular traffic.
- **Boost hours:** time with a full speed, latency, and reliability guarantee.

Subscribers upgrade for **more speed** (Fast and Max tiers) or **more time** (extra boost hours).

**Positioning:** Verizon already builds and sells network slices, mainly through enterprise channels. Priority 5G is a subscription layer that brings that portfolio to everyone on campus.

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

## "If everyone gets a slice, isn't it just normal 5G?"

It would be, if nothing limited it. The design answers this with four rules, all modeled in `lib/simulate.ts`:

1. **Guarantees are capped.** Each cell gives guarantees at most 35% of its capacity (`CAPACITY.guaranteedPoolCap`). Regular users always keep the rest.
2. **Seats are limited.** Each plan type gets its own share of that pool, its own slice: Organization 40%, Small business 25%, Individual 20%, Family 15%. When a share is full, sign-ups go to a waitlist (`seatAvailability`).
3. **Guarantees are time-boxed.** Day to day, subscribers get priority only. The full guarantee runs during metered boost hours, so only a fraction of subscribers boost at once (`peakConcurrency`).
4. **No silent slowdowns.** A boost that won't fit is refused with the next open hour. It never starts degraded (`requestBoost`).

The demo page's "What if everyone subscribes?" explorer shows the difference. With admission control off, priority latency climbs to meet the regular network. With it on, priority stays under the 30 ms guarantee and the extra demand waits for a seat.

## Pages

| Route           | What it shows                                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`             | Hero, the gap table (enterprise-led today vs. subscription), a plan for each customer type, a 5-step "How it works" (Subscribe, Check eligibility, Everyday priority, Boost when it matters, Upgrade), the four fairness rules with a worked example, and a value strip                                                                                 |
| `/plans`        | Four illustrative plans, speed tiers (more speed), extra-hour pricing and top-ups (more time), and a "why some plans show a waitlist" note                                                                                                                                                                                                              |
| `/subscribe`    | 4-step wizard: (1) plan; (2) eligibility: coverage on your home cell and device compatibility, with one-click fixes; (3) speed tier, extra hours, live monthly price, and seat availability; (4) review, then "Subscription active" with an account ID. Sold-out choices offer a slower tier, another cell, or the waitlist. `?plan=` preselects a plan |
| `/account`      | Simulated subscriber dashboard: boost hours meter, start a boost at a simulated time of day (refused with the next open hour when the pool is full), one-time hour top-ups, speed upgrades, and a usage chart. A sample-account switcher covers all four plans                                                                                          |
| `/demo`         | Crowd surge (regular network vs. a boost), KPI cards, SLA status, a subscriber table (boosting, everyday priority, waitlisted), and the density explorer                                                                                                                                                                                                |
| `/business`     | Assumptions panel (sites, sign-up demand, churn, upgrade rate, pool cap), each input tagged "Assumption". Charts: monthly recurring revenue by plan, seats vs. demand (waitlist), revenue mix, and a trial-to-enterprise funnel. Summary: year-one revenue, revenue per subscriber, payback, subscribers and waitlist                                   |
| `/architecture` | Storefront and account → Subscription and entitlements → Admission control → Policy engine → Slice provisioning (simulated; would integrate with the operator's orchestration systems) → 5G standalone core and edge → Monitoring and SLA dashboard, plus security and privacy                                                                          |
| `/pilot`        | 16-week, two-cell NJIT pilot with about 60 subscribers, success metrics with proposed targets, and risks and mitigations                                                                                                                                                                                                                                |

`/book` and `/catalog` from the earlier per-event version redirect to `/subscribe` and `/plans`.

## Project structure

```
app/                          Routes (App Router). Pages are server components.
components/
  kpi-card.tsx, chart-card.tsx, step-wizard.tsx, eligibility-check.tsx,
  slice-badge.tsx, simulated-tag.tsx, plan-icon.tsx   Shared components
  subscribe/                  Subscribe wizard, price panel, seat bar
  account/                    Account dashboard
  demo/                       Live surge dashboard, charts, density explorer
  business/                   Assumptions panel, charts, dashboard
  architecture/               Flow diagram
  charts/ layout/ ui/         Chart theme, header/footer, primitives
hooks/use-surge-simulation.ts Ticks the demo engine
lib/
  config.ts                   ALL simulated constants and assumptions (edit here)
  simulate.ts                 Pure engine: network, subscriptions, density, business
  random.ts                   Seeded, stateless randomness
  format.ts                   Formatters
```

## Every simulated value and assumption

All values live in `lib/config.ts` and are illustrative.

### Plans

| Plan           | Price/mo | Covers     | Everyday           | Boost guarantee (Standard) | Boost hours | Extra hour | Pool share |
| -------------- | -------- | ---------- | ------------------ | -------------------------- | ----------- | ---------- | ---------- |
| Individual     | $12      | 1 line     | Priority, no floor | 25 Mbps, ≤40 ms, 99.9%     | 5           | $1.50      | 20%        |
| Family         | $35      | 5 lines    | Priority + 2 Mbps  | 50 Mbps, ≤40 ms, 99.9%     | 15          | $1.50      | 15%        |
| Small business | $59      | 10 devices | Priority + 5 Mbps  | 25 Mbps, ≤30 ms, 99.99%    | 30          | $2.00      | 25%        |
| Organization   | $149     | 25 devices | Priority + 10 Mbps | 100 Mbps, ≤20 ms, 99.9%    | 60          | $3.00      | 40%        |

- **Speed tiers:**
  - Standard: included.
  - Fast: 2× throughput, 5 ms lower latency, +40% of plan price.
  - Max: 4× throughput, 10 ms lower latency, +100% of plan price.
  - Latency never goes below 15 ms.
- **More time:**
  - Monthly add-on of 0–50 extra hours.
  - One-time top-ups of 5, 10, or 25 hours.
- **Peak concurrency** (share of subscribers boosting at once): Individual 4%, Family 6%, Small business 10%, Organization 10%.

### Capacity and admission

- **Pool size:** guaranteed pool = 35% of site capacity. Each plan type gets its pool share of that.
- **Seats** = plan pool ÷ (boost Mbps × peak concurrency). A tier whose single boost exceeds the plan pool isn't offered on that cell.
- **Seats already sold** per cell and plan = the cell's demand ± 8% seeded noise.
- **Boost admission:**
  - Pool in use at an hour = the cell's busy-hour boost use × hourly shape ± 8% noise.
  - A boost is admitted only if it fits. Otherwise the next hour with room is suggested.
- **Seven fictional campus cells** (1,200–6,000 Mbps):
  - Athletics Stadium is busiest, and Organization seats are sold out there.
  - Library Lower Level has no standalone 5G coverage.
  - Student Center has partial coverage.

### Eligibility

- **Coverage:** full = pass, partial = pass with a note, none = fail with a nearby-cell fix.
- **Devices:**
  - SA phone and SA hotspot: pass.
  - Bonding encoder: pass with a note.
  - Non-standalone phone, LTE phone/tablet, and LTE card reader: fail, with the fix "connect through an SA hotspot over Wi-Fi".

### Live demo network

- **Load curve:** 18% idle → ramp to 100% over 30 s → 8 s hold → 12 s recovery. 500 ms ticks.
- **Regular latency** = 25 + 160 × load³ ms, plus jitter and spikes (typically 160–260 ms at peak).
- **Regular throughput** = 120 × (1 − 0.94 × load^1.6) Mbps, floor 6.
- **Regular packet loss** = 0.1% + 5.9% × load⁴.
- **Boost:** latency 17–28 ms (guarantee ≤30 ms), throughput 50.5–58 Mbps (guarantee ≥50 Mbps), loss about 0.02%.
- **Density explorer** (surge load 95%):
  - Priority latency = 21 + 164 × (admitted share × load)³ ms.
  - Regular latency rises 35% × admitted share.
  - With admission control, the admitted share is capped at 35%.

### Business case

Editable assumptions (defaults): sites **25**, sign-ups wanted per site per month **45**, monthly churn **3%**, upgrade rate **25%**, guaranteed pool cap **35%**.

Scenario presets (one-click buttons on the page; `PRESETS` in `lib/config.ts`):

| Preset                         | Sites   | Sign-ups/site/mo | Churn | Upgrade rate | Pool cap | Year-one revenue | Payback   |
| ------------------------------ | ------- | ---------------- | ----- | ------------ | -------- | ---------------- | --------- |
| NJIT realistic                 | 10      | 10               | 5%    | 15%          | 20%      | ~$162K           | 41 months |
| NJIT optimistic                | 10      | 20               | 4%    | 20%          | 25%      | ~$339K           | 23 months |
| Regional rollout (~8 campuses) | 80      | 10               | 5%    | 15%          | 20%      | ~$1.3M           | 16 months |
| Nationwide (USA)               | 100,000 | 5                | 5%    | 15%          | 20%      | ~$808M           | 18 months |
| Aggressive (original defaults) | 25      | 45               | 3%    | 25%          | 35%      | ~$2.0M           | 11 months |

The nationwide preset's 100,000 sites is an assumption standing in for "every site with standalone 5G in the US". It isn't a real network count. At 5 sign-ups per site per month it reaches about 3.1M subscribers, roughly 1% of the US population. The sites slider is logarithmic so it covers 1 to 100,000.

Fixed assumptions:

| Assumption           | Value                                                            |
| -------------------- | ---------------------------------------------------------------- |
| Sign-up mix          | Individual 45%, Family 20%, Small business 20%, Organization 15% |
| Adoption ramp        | 25% of demand in month 1 → 100% by month 12                      |
| Seats per site       | Sized on an average 3,000 Mbps site at Standard speed            |
| Upgrade spend        | 45% of base price per upgraded subscriber (60% speed, 40% time)  |
| Platform build       | $600,000 one-time                                                |
| Onboarding per site  | $12,000                                                          |
| Operating cost       | 30% of revenue                                                   |
| Trial to paid        | 60%                                                              |
| Enterprise referrals | 12% of Organization and Small business subscribers               |

**How the projection works:**

- Each month, retained subscribers = previous × (1 − churn).
- New sign-ups are admitted up to the plan's seats. The rest join the waitlist.
- Revenue = subscribers × price × (1 + upgrade rate × upgrade spend).
- Payback = first month where cumulative net (revenue × 70% − up-front cost) is ≥ 0.

**Results at the defaults:**

- About **$2.0M** year-one revenue and a **$4.4M** annual run rate by month 12.
- **$51** per subscriber per month.
- **11-month** payback.
- About **7,200** subscribers, with about **280** waitlisted (Family and Organization fill first).

All of these are simulated.

### Pilot

All pilot targets are proposed (for example, a boost guarantee hit rate of at least 99.9%, regular users no more than 10% slower at peak, and a 20% upgrade rate). None are results.

## Content rules followed

- No claims of real network access. Provisioning is labeled simulated.
- No statistics about real companies. The "Today" column describes enterprise-led buying in general terms.
- Plans are labeled "Illustrative plan", scenarios "Illustrative scenario", and every business input "Assumption".

## Design notes

- **Palette:** Verizon-inspired: red `#EE0000` for CTAs, key metrics, and the boost series; black; white; grays `#F6F6F6` / `#D8DADA` / `#747676`. Green and amber are used only for status.
- **Branding:** no Verizon logo; a "Priority 5G" text wordmark with a "Concept demo" tag.
- **Charts:** labeled axes with units, tooltips, legends, `aria-label` summaries, and a fixed color per plan.
- **Accessibility:** skip link, visible focus, native controls, `aria-current` in the nav and wizard, status always shown as icon plus text, and reduced-motion support.
