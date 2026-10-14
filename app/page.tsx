import {
  ArrowRight,
  CalendarClock,
  Gamepad2,
  Gauge,
  Layers,
  MapPin,
  RadioTower,
  ShieldCheck,
  TrendingUp,
  Truck,
  Video,
} from "lucide-react"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { SliceBadge } from "@/components/slice-badge"
import { buttonVariants } from "@/components/ui/button"
import {
  DEFAULT_ASSUMPTIONS,
  DEMO,
  PRICING,
  USE_CASES,
  type UseCaseId,
} from "@/lib/config"
import { formatPct, formatUSD, formatUSDCompact } from "@/lib/format"
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
  icon: typeof Video
  title: string
  problem: string
  outcome: string
  venueId: string
  startHour: number
}[] = [
  {
    useCase: "livestream",
    icon: Video,
    title: "The homecoming livestream",
    problem:
      "At kickoff, 6,000 fans start posting video. The crew's uplink stalls and the stream drops to 240p.",
    outcome: "The broadcast holds 1080p from kickoff to the final whistle.",
    venueId: "campus-green",
    startHour: 13,
  },
  {
    useCase: "food-trucks",
    icon: Truck,
    title: "Food truck row at lunch",
    problem:
      "When the quad fills at noon, card readers on the shared network time out and lines stall.",
    outcome:
      "Six vendors take payments without retries, even at the lunch peak.",
    venueId: "food-truck-row",
    startHour: 10,
  },
  {
    useCase: "esports",
    icon: Gamepad2,
    title: "Hackathon and esports finals",
    problem:
      "Lag spikes decide matches, and live demos freeze in front of the judges.",
    outcome: "Finals run at a steady 20 ms, so the best team wins.",
    venueId: "esports-arena",
    startHour: 12,
  },
]

const STEPS = [
  {
    icon: MapPin,
    title: "Pick a place and time",
    body: "Choose a campus venue, a date, and the hours you need coverage.",
  },
  {
    icon: Layers,
    title: "Get a recommended slice",
    body: "We suggest throughput, latency, and reliability for your use case. Adjust as needed.",
  },
  {
    icon: CalendarClock,
    title: "See price and capacity",
    body: "Your quote updates live with demand, and we never oversell the cell site.",
  },
  {
    icon: ShieldCheck,
    title: "Go live, guaranteed",
    body: "The slice activates on schedule and is monitored against its guarantee.",
  },
]

function HeroPreview() {
  const uc = USE_CASES.livestream
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
        aria-label="Example booking preview"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Booking preview
            </p>
            <p className="mt-1 text-lg font-bold text-ink">{venue.name}</p>
            <p className="text-sm text-muted-foreground">
              Saturday · {hourLabel(18)} to {hourLabel(22)} · {uc.label}
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
            Latency during a crowd surge
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

export default function Home() {
  const business = projectBusiness(DEFAULT_ASSUMPTIONS)
  const offPeakRate =
    PRICING.baseHourlyRate * PRICING.demandBands["off-peak"].multiplier

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
              On-demand 5G network slicing
            </p>
            <h1 className="mt-6 text-5xl leading-[1.02] font-extrabold tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-7xl">
              Guaranteed 5G, booked in a minute.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
              SliceLive lets event crews, vendors, and organizers reserve a
              dedicated slice of the 5G network by the hour. Throughput,
              latency, and reliability are guaranteed, and the price follows
              demand.
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
                View live demo
              </Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-3 gap-6 border-t border-gray-mid pt-6">
              {[
                [`≤${DEMO.slice.guaranteeLatencyMs} ms`, "guaranteed latency"],
                [`${formatUSD(offPeakRate)}/hr`, "off-peak starting rate"],
                ["3 steps", "from venue to live slice"],
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
          </div>
          <HeroPreview />
        </Container>
      </section>

      {/* Scenarios */}
      <section
        className="bg-gray-light py-20"
        aria-labelledby="scenarios-heading"
      >
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-red">
              Who it&apos;s for
            </p>
            <h2
              id="scenarios-heading"
              className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl"
            >
              When the crowd shows up, the network still works.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Shared networks slow down when everyone is on them at once. A
              slice gives one customer reserved capacity that the crowd
              can&apos;t use up.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SCENARIOS.map((s) => {
              const uc = USE_CASES[s.useCase]
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
                  <span className="flex size-11 items-center justify-center rounded-lg bg-ink text-white">
                    <s.icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {uc.label}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {s.problem}
                  </p>
                  <dl className="tabular mt-5 grid grid-cols-3 gap-2 rounded-lg bg-gray-light p-3 text-center">
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
                    for {uc.typicalHours} hours on a Saturday
                  </p>
                </article>
              )
            })}
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-20" aria-labelledby="how-heading">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-brand-red">
                How it works
              </p>
              <h2
                id="how-heading"
                className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl"
              >
                Self-serve, like booking a room.
              </h2>
            </div>
            <Link
              href="/book"
              className={buttonVariants({ variant: "outline" })}
            >
              Try the booking flow
            </Link>
          </div>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-red">
              Why it matters
            </p>
            <h2
              id="value-heading"
              className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl"
            >
              A new product built on capacity the network already has.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                metric: formatUSDCompact(business.annualRevenue),
                metricLabel: `projected year-one revenue, ${DEFAULT_ASSUMPTIONS.numberOfSites} sites`,
                title: "New revenue",
                body: "Hourly slices give the network a new product to sell to campus events, creators, and small businesses.",
              },
              {
                icon: Gauge,
                metric: `+${business.utilizationLiftPts.toFixed(1)} pts`,
                metricLabel: `average cell utilization (${formatPct(business.utilizationLiftPct, 1)} relative)`,
                title: "Better off-peak utilization",
                body: "Demand pricing moves flexible bookings into daytime and late-evening valleys instead of the evening peak.",
              },
              {
                icon: RadioTower,
                metric: "SA 5G",
                metricLabel: "standalone core with end-to-end slicing",
                title: "Shows what standalone 5G can do",
                body: "Customers can see and buy network slicing directly, with a guarantee they can check.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-lg border border-gray-mid bg-white p-6 shadow-card"
              >
                <v.icon className="size-6 text-ink" aria-hidden="true" />
                <p className="tabular mt-6 text-4xl font-extrabold tracking-[-0.03em] text-brand-red">
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
            Figures come from the simulated business model using its default
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
              A 30-second simulation of a packed stadium, standard network vs.
              slice.
            </p>
          </div>
          <Link
            href="/demo"
            className={cn(buttonVariants({ size: "lg" }), "shrink-0")}
          >
            View live demo
            <ArrowRight />
          </Link>
        </Container>
      </section>
    </>
  )
}
