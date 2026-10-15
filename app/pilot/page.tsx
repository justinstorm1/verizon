import { ArrowRight, CalendarDays, Flag, Target } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"
import { buttonVariants } from "@/components/ui/button"
import { CAPACITY, DEMO } from "@/lib/config"
import { formatPct } from "@/lib/format"

export const metadata: Metadata = { title: "Pilot plan" }

const TIMELINE = [
  {
    when: "Weeks 1–2",
    title: "Partner and plan",
    body: "Choose one campus event and its organizers, confirm the venue, and agree on success metrics and a data-sharing plan.",
  },
  {
    when: "Week 3",
    title: "Site survey",
    body: "Confirm standalone 5G coverage across the venue, and measure the standard network during a comparable busy period.",
  },
  {
    when: "Week 4",
    title: "Device check",
    body: "List the devices organizers will use, run eligibility checks, and stage SA hotspots for anything that can't join a slice.",
  },
  {
    when: "Week 5",
    title: "Dry run",
    body: "Organizers book their slices through the storefront. We activate them in a rehearsal and verify the SLA dashboard.",
  },
  {
    when: "Week 6",
    title: "Event day",
    body: "Slices run for the event, with the standard network measured side by side. Support is on site.",
  },
  {
    when: "Week 7",
    title: "Report and decide",
    body: "Compare results to targets, survey organizers, and make a go / no-go call on a multi-event pilot.",
  },
]

const METRICS = [
  {
    metric: "Latency vs. standard network",
    measure:
      "95th-percentile latency on the slice and on the standard network during the event's busiest hour",
    target: `Slice ≤ ${DEMO.slice.guaranteeLatencyMs} ms, and at least 3× lower than standard`,
  },
  {
    metric: "Throughput vs. standard network",
    measure:
      "Sustained throughput per slice compared with a standard-network device at the same spot",
    target: "At or above the booked rate in 99.9% of minutes",
  },
  {
    metric: "Booking-to-activation time",
    measure:
      "Time from the organizer confirming a booking to the slice being ready to use",
    target: "Under 15 minutes",
  },
  {
    metric: "Organizer satisfaction",
    measure: 'Post-event survey, 1 to 5, plus "would you book again?"',
    target: "Average 4.5 or higher; 80% would book again",
  },
]

const RISKS = [
  {
    risk: "Device compatibility",
    detail:
      "Organizers bring LTE or non-standalone devices that can't join a slice.",
    mitigation:
      "Device check at booking, a week-4 device inventory, and loaner SA hotspots so older devices can connect over Wi-Fi.",
  },
  {
    risk: "Coverage",
    detail:
      "Parts of the venue lack standalone 5G, for example indoors or below grade.",
    mitigation:
      "Week-3 site survey. The storefront blocks venues without coverage and suggests a nearby alternative.",
  },
  {
    risk: "Oversell",
    detail:
      "Too many slices are reserved for the site's capacity, so guarantees slip.",
    mitigation: `The capacity engine caps reservations at ${formatPct(CAPACITY.maxReservable)} of sliceable capacity. The pilot is limited to five slices.`,
  },
  {
    risk: "Pricing assumptions",
    detail:
      "Demand, price per hour, and off-peak uptake are unvalidated assumptions.",
    mitigation:
      "Run the pilot free or discounted, survey willingness to pay, and update the assumptions in the business model with real results.",
  },
]

export default function PilotPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pilot plan"
        title="Prove it at one NJIT campus event"
        description="A seven-week plan to test SliceLive with real organizers at a single campus event before scaling. Weeks are relative to kickoff; all targets are proposed."
      />

      <Container className="space-y-16 py-12 sm:py-16">
        {/* At a glance */}
        <section aria-label="Pilot at a glance">
          <dl className="grid gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Scope", "One venue, one event day"],
              ["Example event", "Outdoor festival or esports tournament"],
              ["Slices", "Up to 5: livestream, vendors, staff comms"],
              ["Duration", "7 weeks from kickoff to decision"],
            ].map(([k, v]) => (
              <div key={k} className="bg-white p-5">
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {k}
                </dt>
                <dd className="mt-1 font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Timeline */}
        <section aria-labelledby="timeline-heading">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 text-ink" aria-hidden="true" />
            <h2
              id="timeline-heading"
              className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
            >
              Timeline
            </h2>
          </div>
          <ol className="relative mt-8 grid gap-6 lg:grid-cols-6 lg:gap-4">
            <span
              aria-hidden="true"
              className="absolute top-3 right-0 left-0 hidden h-0.5 bg-gray-mid lg:block"
            />
            {TIMELINE.map((t, i) => (
              <li key={t.title} className="relative flex gap-4 lg:block">
                <span
                  aria-hidden="true"
                  className={
                    i === 4
                      ? "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-red ring-4 ring-white"
                      : "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ink ring-4 ring-white"
                  }
                >
                  {i === 4 ? (
                    <Flag className="size-3 text-white" />
                  ) : (
                    <span className="size-2 rounded-full bg-white" />
                  )}
                </span>
                <div className="lg:mt-5">
                  <p className="tabular text-xs font-bold text-brand-red">
                    {t.when}
                  </p>
                  <h3 className="mt-1 font-bold text-ink">{t.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Success metrics */}
        <section aria-labelledby="metrics-heading">
          <div className="flex items-center gap-3">
            <Target className="size-5 text-ink" aria-hidden="true" />
            <h2
              id="metrics-heading"
              className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
            >
              Success metrics
            </h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Targets are proposals for the pilot, not results.
          </p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-gray-mid shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Pilot success metrics and proposed targets
              </caption>
              <thead>
                <tr className="border-b border-gray-mid bg-gray-light text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Metric
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    How we measure it
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Proposed target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-mid bg-white">
                {METRICS.map((m) => (
                  <tr key={m.metric}>
                    <th
                      scope="row"
                      className="px-5 py-4 align-top font-semibold text-ink"
                    >
                      {m.metric}
                    </th>
                    <td className="px-5 py-4 align-top text-muted-foreground">
                      {m.measure}
                    </td>
                    <td className="px-5 py-4 align-top font-semibold text-ink">
                      {m.target}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Risks */}
        <section aria-labelledby="risks-heading">
          <h2
            id="risks-heading"
            className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
          >
            Risks and mitigations
          </h2>
          <div className="mt-6 overflow-x-auto rounded-lg border border-gray-mid shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Pilot risks and how each is mitigated
              </caption>
              <thead>
                <tr className="border-b border-gray-mid bg-gray-light text-xs text-muted-foreground">
                  <th scope="col" className="w-1/5 px-5 py-3 font-semibold">
                    Risk
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    What could go wrong
                  </th>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Mitigation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-mid bg-white">
                {RISKS.map((r) => (
                  <tr key={r.risk}>
                    <th
                      scope="row"
                      className="px-5 py-4 align-top font-semibold text-ink"
                    >
                      {r.risk}
                    </th>
                    <td className="px-5 py-4 align-top text-muted-foreground">
                      {r.detail}
                    </td>
                    <td className="px-5 py-4 align-top text-ink">
                      {r.mitigation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex flex-col items-start justify-between gap-6 rounded-lg bg-ink p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-[-0.02em]">
              See what organizers would book.
            </h2>
            <p className="mt-2 text-[#c9cbcb]">
              Walk through the storefront exactly as a pilot organizer would.
            </p>
          </div>
          <Link href="/book" className={buttonVariants({ size: "lg" })}>
            Try the booking flow
            <ArrowRight />
          </Link>
        </section>
      </Container>
    </>
  )
}
