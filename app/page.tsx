import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Check,
  CircleDollarSign,
  Gauge,
  LayoutGrid,
  LineChart,
  RadioTower,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { SliceBadge } from "@/components/slice-badge"
import { buttonVariants } from "@/components/ui/button"
import { USE_CASE_ICONS } from "@/components/use-case-icon"
import {
  DEFAULT_ASSUMPTIONS,
  DEMO,
  PACKAGES,
  PRICING,
  USE_CASES,
  type UseCaseId,
} from "@/lib/config"
import { formatInt, formatUSD, formatUSDCompact } from "@/lib/format"
import {
  getVenue,
  hourLabel,
  projectBusiness,
  quoteBooking,
} from "@/lib/simulate"
import { cn } from "@/lib/utils"

/** A fixed Saturday keeps landing-page quotes stable between renders. */
const SAMPLE_DATE = "2026-10-17"

const SCENARIOS: {
  useCase: UseCaseId
  title: string
  problem: string
  outcome: string
  venueId: string
  startHour: number
}[] = [
  {
    useCase: "livestream",
    title: "Homecoming livestream",
    problem:
      "At kickoff, thousands of fans start posting video, and the student media crew's uplink stalls.",
    outcome:
      "The broadcast holds full quality from kickoff to the final whistle.",
    venueId: "campus-green",
    startHour: 13,
  },
  {
    useCase: "food-trucks",
    title: "Food truck row at lunch",
    problem:
      "When the quad fills at noon, card readers on the shared network time out and lines stall.",
    outcome: "Every vendor keeps taking payments through the lunch peak.",
    venueId: "food-truck-row",
    startHour: 10,
  },
  {
    useCase: "esports",
    title: "Hackathon and esports finals",
    problem:
      "Lag spikes decide matches, and live demos freeze in front of the judges.",
    outcome: "Finals run at a steady 20 ms, so the best team wins.",
    venueId: "esports-arena",
    startHour: 12,
  },
  {
    useCase: "popup-retail",
    title: "Weekend makers market",
    problem:
      "Student sellers take cards and mobile orders in a crowded atrium, and checkout keeps failing.",
    outcome: "A small, very reliable slice keeps every sale going through.",
    venueId: "innovation-hall",
    startHour: 10,
  },
]

const GAP_ROWS: [string, string, string][] = [
  [
    "Who it's built for",
    "Large organizations with an account team",
    "Small businesses, student orgs, and event organizers",
  ],
  [
    "How you buy",
    "Sales conversation and a custom quote",
    "Self-serve storefront with an instant quote",
  ],
  ["Commitment", "Longer-term agreements", "By the hour"],
  [
    "Time to set up",
    "Planned with the account team",
    "Scheduled online in minutes",
  ],
  ["Pricing", "Negotiated per customer", "Published, with off-peak discounts"],
  [
    "Proof it worked",
    "Reports through the account team",
    "Live SLA dashboard for every booking",
  ],
]

const STEPS = [
  {
    icon: LayoutGrid,
    title: "Choose",
    body: "Pick a venue, a time window, and a package that fits your event.",
  },
  {
    icon: BadgeCheck,
    title: "Check eligibility",
    body: "We confirm standalone 5G coverage at the site and that your devices can join a slice.",
  },
  {
    icon: CircleDollarSign,
    title: "Price",
    body: "Get an instant, demand-based quote. We never oversell the site's capacity.",
  },
  {
    icon: Zap,
    title: "Activate",
    body: "The slice is scheduled and switches on before your event starts.",
  },
  {
    icon: LineChart,
    title: "Prove",
    body: "Watch latency and throughput against the guarantee live, then get a report.",
  },
]

function HeroPreview() {
  const uc = USE_CASES.livestream
  const pkg = PACKAGES[uc.packageId]
  const quote = quoteBooking({
    venueId: "campus-green",
    dateISO: SAMPLE_DATE,
    startHour: 18,
    durationHours: 4,
    useCase: "livestream",
    profile: uc.recommended,
  })
  const venue = getVenue("campus-green")
  const standardMs = 162
  const sliceMs = 24

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-gray-light to-white"
      />
      <figure
        className="rounded-xl border border-gray-mid bg-white p-6 shadow-raised"
        aria-label="Example booking preview with simulated values"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Booking preview · {pkg.name}
            </p>
            <p className="mt-1 text-lg font-bold text-ink">{venue.name}</p>
            <p className="text-sm text-muted-foreground">
              Saturday · {hourLabel(18)} to {hourLabel(22)}
            </p>
          </div>
          <SliceBadge status="met" />
        </div>

        <dl className="mt-6 grid grid-cols-3 divide-x divide-gray-mid rounded-lg border border-gray-mid">
          {[
            ["Throughput", `${uc.recommended.throughputMbps}`, "Mbps"],
            ["Max latency", `${uc.recommended.maxLatencyMs}`, "ms"],
            ["Reliability", `${uc.recommended.reliability}`, "%"],
          ].map(([label, value, unit]) => (
            <div key={label} className="px-3 py-3 sm:px-4">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="tabular mt-0.5 text-xl font-extrabold text-ink">
                {value}
                <span className="ml-0.5 text-xs font-semibold text-muted-foreground">
                  {unit}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          <p className="text-sm font-semibold text-ink">
            Latency during a crowd surge{" "}
            <span className="font-normal text-muted-foreground">
              (simulated)
            </span>
          </p>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Standard network</span>
                <span className="tabular font-semibold text-ink">
                  {standardMs} ms
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-light">
                <div
                  className="h-2 rounded-full bg-gray-dark"
                  style={{ width: `${(standardMs / 180) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your slice</span>
                <span className="tabular font-semibold text-brand-red">
                  {sliceMs} ms
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-light">
                <div
                  className="h-2 rounded-full bg-brand-red"
                  style={{ width: `${(sliceMs / 180) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between border-t border-gray-mid pt-4">
          <div>
            <p className="text-xs text-muted-foreground">
              Quoted total, 4 hours
            </p>
            <p className="tabular text-2xl font-extrabold text-ink">
              {formatUSD(quote.total)}
            </p>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            Peak-hour pricing
            <br />
            Simulated quote
          </p>
        </div>
      </figure>
    </div>
  )
}

function SectionIntro({
  id,
  eyebrow,
  title,
  body,
}: {
  id: string
  eyebrow: string
  title: string
  body?: string
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-brand-red">{eyebrow}</p>
      <h2
        id={id}
        className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-balance text-ink sm:text-4xl"
      >
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-lg text-muted-foreground">{body}</p>
      ) : null}
    </div>
  )
}

export default function Home() {
  const business = projectBusiness(DEFAULT_ASSUMPTIONS)
  const offPeakRate =
    PRICING.baseHourlyRate * PRICING.demandBands["off-peak"].multiplier
  const upgradeLeads = business.funnel[business.funnel.length - 1].customers

  return (
    <>
      {/* Hero */}
      <section className="overflow-hidden border-b border-gray-mid">
        <Container className="grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gray-mid px-3 py-1 text-xs font-semibold text-ink">
              <span
                className="size-1.5 rounded-full bg-brand-red"
                aria-hidden="true"
              />
              Self-serve 5G network slicing
            </p>
            <h1 className="mt-6 text-5xl leading-[1.02] font-extrabold tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-7xl">
              Guaranteed 5G, booked in minutes.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
              SliceLive is a self-serve storefront on top of Verizon&apos;s
              network-slicing portfolio. Small businesses, student orgs, and
              event organizers book a slice with guaranteed throughput and
              latency by the hour, without a sales contract.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book" className={buttonVariants({ size: "lg" })}>
                Book a slice
                <ArrowRight />
              </Link>
              <Link
                href="/demo"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                See the live demo
              </Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-gray-mid pt-6">
              {[
                [`≤${DEMO.slice.guaranteeLatencyMs} ms`, "latency guarantee"],
                [`${formatUSD(offPeakRate)}/hr`, "off-peak starting rate"],
                ["5 steps", "from choosing to proof"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="tabular block text-2xl font-extrabold text-ink">
                      {value}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative profile and simulated pricing.
            </p>
          </div>
          <HeroPreview />
        </Container>
      </section>

      {/* The gap */}
      <section className="py-20" aria-labelledby="gap-heading">
        <Container>
          <SectionIntro
            id="gap-heading"
            eyebrow="The gap"
            title="Network slices exist. Small customers can't easily buy them."
            body="Slicing is sold mainly through enterprise channels today. That works for large, long-term deployments, but not for a student org that needs guaranteed coverage for one Saturday."
          />
          <div className="mt-10 overflow-x-auto rounded-lg border border-gray-mid shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Comparison of enterprise-sales-led slicing today with SliceLive
              </caption>
              <thead>
                <tr className="border-b border-gray-mid">
                  <th scope="col" className="w-1/5 bg-white px-5 py-4" />
                  <th
                    scope="col"
                    className="bg-gray-light px-5 py-4 text-base font-bold text-ink"
                  >
                    Today: enterprise-led
                  </th>
                  <th
                    scope="col"
                    className="bg-ink px-5 py-4 text-base font-bold text-white"
                  >
                    Slice<span className="text-brand-red">Live</span>:
                    self-serve
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-mid">
                {GAP_ROWS.map(([label, today, slicelive]) => (
                  <tr key={label}>
                    <th
                      scope="row"
                      className="bg-white px-5 py-4 font-semibold text-ink"
                    >
                      {label}
                    </th>
                    <td className="bg-gray-light/60 px-5 py-4 text-muted-foreground">
                      {today}
                    </td>
                    <td className="bg-white px-5 py-4 text-ink">
                      <span className="flex gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-brand-red"
                          aria-hidden="true"
                        />
                        {slicelive}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            &ldquo;Today&rdquo; describes enterprise, sales-led buying in
            general terms. It doesn&apos;t describe any specific contract.
          </p>
        </Container>
      </section>

      {/* Scenarios */}
      <section
        className="border-y border-gray-mid bg-gray-light py-20"
        aria-labelledby="scenarios-heading"
      >
        <Container>
          <SectionIntro
            id="scenarios-heading"
            eyebrow="Who it's for"
            title="When the crowd shows up, the network still works."
            body="Shared networks slow down when everyone is on them at once. A slice reserves capacity for one customer that the crowd can't use up."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {SCENARIOS.map((s) => {
              const uc = USE_CASES[s.useCase]
              const Icon = USE_CASE_ICONS[s.useCase]
              const q = quoteBooking({
                venueId: s.venueId,
                dateISO: SAMPLE_DATE,
                startHour: s.startHour,
                durationHours: uc.typicalHours,
                useCase: s.useCase,
                profile: uc.recommended,
              })
              return (
                <article
                  key={s.useCase}
                  className="flex flex-col rounded-lg border border-gray-mid bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-raised"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-ink text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Illustrative scenario
                    </span>
                  </div>
                  <p className="mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {uc.label}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {s.problem}
                  </p>
                  <p className="mt-5 text-xs font-semibold text-ink">
                    {PACKAGES[uc.packageId].name} package
                  </p>
                  <dl className="tabular mt-2 grid grid-cols-3 gap-2 rounded-lg bg-gray-light p-3 text-center">
                    <div>
                      <dt className="text-[11px] text-muted-foreground">
                        Throughput
                      </dt>
                      <dd className="text-sm font-bold">
                        {uc.recommended.throughputMbps} Mbps
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">
                        Latency
                      </dt>
                      <dd className="text-sm font-bold">
                        ≤{uc.recommended.maxLatencyMs} ms
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">
                        Reliability
                      </dt>
                      <dd className="text-sm font-bold">
                        {uc.recommended.reliability}%
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-5 flex gap-2 text-sm font-medium text-ink">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0 text-brand-red"
                      aria-hidden="true"
                    />
                    {s.outcome}
                  </p>
                  <p className="mt-auto pt-5 text-sm text-muted-foreground">
                    About{" "}
                    <span className="tabular font-semibold text-ink">
                      {formatUSD(q.total)}
                    </span>{" "}
                    for {uc.typicalHours} hours on a Saturday (simulated)
                  </p>
                </article>
              )
            })}
          </div>
          <div className="mt-8">
            <Link
              href="/catalog"
              className={buttonVariants({ variant: "outline" })}
            >
              Browse the slice catalog
              <ArrowRight />
            </Link>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-20" aria-labelledby="how-heading">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionIntro
              id="how-heading"
              eyebrow="How it works"
              title="Self-serve, like booking a room."
            />
            <Link
              href="/book"
              className={buttonVariants({ variant: "outline" })}
            >
              Try the booking flow
            </Link>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <span className="tabular text-sm font-bold text-brand-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <step.icon className="size-5 text-ink" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Business value */}
      <section
        className="border-t border-gray-mid bg-gray-light py-20"
        aria-labelledby="value-heading"
      >
        <Container>
          <SectionIntro
            id="value-heading"
            eyebrow="Why it matters"
            title="A new product line built on the slicing portfolio that already exists."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                metric: formatUSDCompact(business.annualRevenue),
                metricLabel: `simulated year-one revenue, ${DEFAULT_ASSUMPTIONS.numberOfSites} sites`,
                title: "New revenue",
                body: "Hourly slices open a new segment: campus events, creators, and small businesses.",
              },
              {
                icon: Gauge,
                metric: `+${business.nonPeakLiftPts.toFixed(1)} pts`,
                metricLabel: "simulated off-peak cell utilization",
                title: "Off-peak utilization",
                body: "Discounted off-peak hours fill daytime and late-evening capacity that would otherwise sit idle.",
              },
              {
                icon: RadioTower,
                metric: "SA 5G",
                metricLabel: "standalone core with end-to-end slicing",
                title: "Portfolio showcase",
                body: "Puts network slicing in front of customers who've never seen it, with a guarantee they can check.",
              },
              {
                icon: CalendarClock,
                metric: formatInt(upgradeLeads),
                metricLabel: "simulated enterprise upgrade leads per year",
                title: "Upgrade pipeline",
                body: "Repeat bookers are qualified leads for the enterprise slicing portfolio.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-lg border border-gray-mid bg-white p-6 shadow-card"
              >
                <v.icon className="size-6 text-ink" aria-hidden="true" />
                <p
                  className={cn(
                    "tabular mt-6 text-4xl font-extrabold tracking-[-0.03em]",
                    v.title === "Portfolio showcase"
                      ? "text-ink"
                      : "text-brand-red"
                  )}
                >
                  {v.metric}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {v.metricLabel}
                </p>
                <h3 className="mt-6 text-lg font-bold text-ink">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            All figures are simulated from the business model&apos;s default
            assumptions.{" "}
            <Link
              href="/business"
              className="font-semibold text-ink underline underline-offset-4"
            >
              Adjust the assumptions
            </Link>
          </p>
        </Container>
      </section>

      {/* Closing CTA */}
      <section className="bg-ink py-16 text-white">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Watch the guarantee hold during a crowd surge.
            </h2>
            <p className="mt-3 text-lg text-[#c9cbcb]">
              A 30-second simulation of a packed venue, standard network vs.
              slice.
            </p>
          </div>
          <Link
            href="/demo"
            className={cn(buttonVariants({ size: "lg" }), "shrink-0")}
          >
            See the live demo
            <ArrowRight />
          </Link>
        </Container>
      </section>
    </>
  )
}
