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
    when: "Weeks 1–3",
    title: "Recruit and set up",
    body: "Recruit about 60 pilot subscribers across all four plans, confirm two campus cells, and agree on metrics and data sharing.",
  },
  {
    when: "Weeks 4–5",
    title: "Check coverage and devices",
    body: "Survey standalone 5G on both cells, run eligibility checks for every subscriber, and hand out SA hotspots where needed.",
  },
  {
    when: "Weeks 6–9",
    title: "Free month",
    body: "Everyone gets everyday priority and boost hours at no cost. We measure boosts against the regular network side by side.",
  },
  {
    when: "Weeks 10–13",
    title: "Paid month",
    body: "Subscribers pay pilot prices and can upgrade for more speed or time. We track upgrades, cancellations, and waitlist demand.",
  },
  {
    when: "Week 14",
    title: "Big-event stress test",
    body: "Run one large campus event with seats deliberately full, to test admission control and refused-boost handling.",
  },
  {
    when: "Weeks 15–16",
    title: "Report and decide",
    body: "Compare results to targets, survey subscribers and non-subscribers, and decide whether to expand to more cells.",
  },
]

const METRICS = [
  {
    metric: "Boost guarantee hit rate",
    measure:
      "Share of boost minutes that met the plan's latency and throughput guarantee, including during the stress test",
    target: "99.9% or higher",
  },
  {
    metric: "Impact on regular users",
    measure:
      "Latency and throughput for non-subscribers at peak, with and without pilot boosts running",
    target: "No more than 10% slower at peak",
  },
  {
    metric: "Boost vs. regular network",
    measure:
      "95th-percentile latency for boosting subscribers vs. the regular network in the busiest hour",
    target: `Boost ≤ ${DEMO.slice.guaranteeLatencyMs} ms and at least 3× lower`,
  },
  {
    metric: "Upgrades and retention",
    measure:
      "Share of paid subscribers who buy more speed or time, and who keep their plan after the pilot",
    target: "20% upgrade; 70% would keep their plan",
  },
  {
    metric: "Subscriber satisfaction",
    measure: "End-of-pilot survey, 1 to 5",
    target: "Average 4.3 or higher",
  },
]

const RISKS = [
  {
    risk: "Everyone gets priority",
    detail:
      "If too many people subscribe, priority turns into another crowded network.",
    mitigation: `Each cell caps guarantees at ${formatPct(CAPACITY.guaranteedPoolCap)} of capacity and stops selling seats when full. Extra demand goes to a waitlist.`,
  },
  {
    risk: "Fairness to non-subscribers",
    detail:
      "Regular users may feel pushed aside, which can hurt the campus's goodwill.",
    mitigation:
      "Regular traffic always keeps at least 65% of each cell. Impact on regular users is a pilot metric with a pass/fail target.",
  },
  {
    risk: "Device compatibility",
    detail: "Older or LTE-only phones and card readers can't join a slice.",
    mitigation:
      "Device check at sign-up, plus loaner SA hotspots so older devices can connect over Wi-Fi.",
  },
  {
    risk: "Coverage",
    detail: "Parts of campus lack standalone 5G, for example below grade.",
    mitigation:
      "Coverage survey before launch. Sign-up blocks cells without coverage and suggests a nearby one.",
  },
  {
    risk: "Pricing assumptions",
    detail:
      "Plan prices, upgrade rates, and churn are unvalidated assumptions.",
    mitigation:
      "Test pilot prices in the paid month, survey willingness to pay, and update the business model with real results.",
  },
]

export default function PilotPage() {
  return (
    <>
      <PageHeader
        eyebrow="Pilot plan"
        title="One semester on two NJIT campus cells"
        description="A 16-week plan to test Priority 5G subscriptions with real students, families, businesses, and organizations before expanding. Weeks are relative to kickoff; all targets are proposed."
      />

      <Container className="space-y-16 py-12 sm:py-16">
        {/* At a glance */}
        <section aria-label="Pilot at a glance">
          <dl className="grid gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Scope", "Two campus cells"],
              ["Subscribers", "About 60 across all four plans"],
              ["Pricing", "One free month, then one paid month"],
              ["Duration", "16 weeks from kickoff to decision"],
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
              See what pilot subscribers would sign up for.
            </h2>
            <p className="mt-2 text-[#c9cbcb]">
              Walk through the plans and sign-up exactly as a pilot subscriber
              would.
            </p>
          </div>
          <Link href="/plans" className={buttonVariants({ size: "lg" })}>
            See the plans
            <ArrowRight />
          </Link>
        </section>
      </Container>
    </>
  )
}
