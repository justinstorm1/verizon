import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Check,
  Clock,
  Gauge,
  Layers,
  ListChecks,
  RadioTower,
  Repeat,
  Scale,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { PLAN_ICONS } from "@/components/plan-icon"
import { SliceBadge } from "@/components/slice-badge"
import { buttonVariants } from "@/components/ui/button"
import {
  CAPACITY,
  DEFAULT_ASSUMPTIONS,
  PLAN_ORDER,
  PLANS,
  type PlanId,
} from "@/lib/config"
import { formatInt, formatPct, formatUSD, formatUSDCompact } from "@/lib/format"
import { boostProfile, projectBusiness, segmentPoolMbps } from "@/lib/simulate"
import { cn } from "@/lib/utils"

const SCENARIOS: Record<PlanId, { title: string; story: string }> = {
  individual: {
    title: "A student on game day",
    story:
      "Jordan's phone is useless in the packed stadium. With a boost, video calls and mobile tickets work like the stands are empty.",
  },
  family: {
    title: "A family at move-in",
    story:
      "Five phones, one crowded weekend. Shared boost hours keep everyone reachable while they haul boxes across campus.",
  },
  "small-business": {
    title: "A food truck at lunch",
    story:
      "When the quad fills at noon, card readers on the regular network time out. A small, very reliable slice keeps every sale going through.",
  },
  organization: {
    title: "Campus media and esports",
    story:
      "Streams and tournament play need low, steady latency. The Organization plan boosts at 100 Mbps and 20 ms when it matters.",
  },
}

const GAP_ROWS: [string, string, string][] = [
  [
    "Who can buy",
    "Large organizations with an account team",
    "Individuals, families, small businesses, and organizations",
  ],
  [
    "How you buy",
    "Sales conversation and a custom quote",
    "Pick a plan online in minutes",
  ],
  ["Commitment", "Longer-term agreements", "Monthly, cancel any time"],
  [
    "Getting more",
    "Renegotiate the contract",
    "Upgrade for more speed or more time",
  ],
  ["Pricing", "Negotiated per customer", "Published plans from $12 a month"],
  [
    "Proof it worked",
    "Reports through the account team",
    "Live guarantee status on every boost",
  ],
]

const STEPS = [
  {
    icon: UserPlus,
    title: "Subscribe",
    body: "Pick a plan for yourself, your family, your business, or your organization.",
  },
  {
    icon: BadgeCheck,
    title: "Check eligibility",
    body: "We confirm standalone 5G coverage where you'll use it and that your devices can join.",
  },
  {
    icon: RadioTower,
    title: "Everyday priority",
    body: "Your traffic goes ahead of regular traffic all month.",
  },
  {
    icon: Zap,
    title: "Boost when it matters",
    body: "Start a boost for a full speed and latency guarantee, using your monthly hours.",
  },
  {
    icon: TrendingUp,
    title: "Upgrade",
    body: "Running low or need more? Add hours or move to a faster tier any time.",
  },
]

function HeroPreview() {
  const plan = PLANS.organization
  const boost = boostProfile("organization", "fast")
  const standardMs = 162
  const boostMs = 14

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-br from-gray-light to-white"
      />
      <figure
        className="rounded-xl border border-gray-mid bg-white p-6 shadow-raised"
        aria-label="Example account preview with simulated values"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Account preview
            </p>
            <p className="mt-1 text-lg font-bold text-ink">Esports Club</p>
            <p className="text-sm text-muted-foreground">
              {plan.name} plan · Fast speed
            </p>
          </div>
          <SliceBadge status="boosting" />
        </div>

        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-ink">Boost hours left</span>
            <span className="tabular font-semibold text-ink">
              42 of {plan.boostHours} h
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-gray-light">
            <div className="h-2 rounded-full bg-ink" style={{ width: "70%" }} />
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 divide-x divide-gray-mid rounded-lg border border-gray-mid">
          {[
            ["Boost speed", `${boost.throughputMbps}`, "Mbps"],
            ["Max latency", `${boost.maxLatencyMs}`, "ms"],
            ["Reliability", `${boost.reliability}`, "%"],
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
            Latency in a packed arena{" "}
            <span className="font-normal text-muted-foreground">
              (simulated)
            </span>
          </p>
          <div className="mt-3 space-y-3 text-sm">
            <div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Regular network</span>
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
                <span className="text-muted-foreground">Your boost</span>
                <span className="tabular font-semibold text-brand-red">
                  {boostMs} ms
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-light">
                <div
                  className="h-2 rounded-full bg-brand-red"
                  style={{ width: `${(boostMs / 180) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-gray-mid pt-4">
          <SliceBadge status="met" />
          <p className="text-right text-xs text-muted-foreground">
            Simulated account
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
  const upgradeShare = business.revenueMix
    .filter((r) => r.id !== "base")
    .reduce((s, r) => s + r.share, 0)
  const enterpriseLeads = business.funnel[business.funnel.length - 1].customers
  const cap = CAPACITY.guaranteedPoolCap
  const examplePool = segmentPoolMbps(3000, "organization")

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
              NJIT Verizon Smart Campus Challenge · Concept
            </p>
            <h1 className="mt-6 text-5xl leading-[1.02] font-extrabold tracking-[-0.04em] text-balance text-ink sm:text-6xl lg:text-7xl">
              Guaranteed 5G on campus, by subscription.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground sm:text-xl">
              Priority 5G brings Verizon&apos;s network slicing to everyone on
              campus. Individuals, families, small businesses, and organizations
              get everyday priority plus monthly boost hours with a real speed
              and latency guarantee, and can upgrade for more speed or time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/plans" className={buttonVariants({ size: "lg" })}>
                See plans
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
                [`${formatUSD(PLANS.individual.price)}/mo`, "plans start at"],
                ["4 plans", "for every kind of customer"],
                [`${formatPct(cap)} cap`, "on guarantees per cell"],
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
              Illustrative plans and simulated values.
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
            title="Network slicing exists. Most people on campus can't buy it."
            body="Slicing is sold mainly through enterprise channels today. That works for large, long-term deployments, but not for a student, a family, or a food truck."
          />
          <div className="mt-10 overflow-x-auto rounded-lg border border-gray-mid shadow-card">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Comparison of enterprise-sales-led slicing today with Priority
                5G
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
                    Priority <span className="text-brand-red">5G</span>:
                    subscription
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-mid">
                {GAP_ROWS.map(([label, today, ours]) => (
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
                        {ours}
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

      {/* Plans for everyone */}
      <section
        className="border-y border-gray-mid bg-gray-light py-20"
        aria-labelledby="who-heading"
      >
        <Container>
          <SectionIntro
            id="who-heading"
            eyebrow="Who it's for"
            title="One plan for each kind of customer."
            body="Everyone shares the same campus network. Priority 5G lets each person or group pay for the reliability they actually need."
          />
          <ul className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id]
              const Icon = PLAN_ICONS[id]
              const s = SCENARIOS[id]
              return (
                <li
                  key={id}
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
                    {p.audience}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {s.story}
                  </p>
                  <dl className="tabular mt-5 grid grid-cols-3 gap-2 rounded-lg bg-gray-light p-3 text-center">
                    <div>
                      <dt className="text-[11px] text-muted-foreground">
                        Boost
                      </dt>
                      <dd className="text-sm font-bold">
                        {p.boost.throughputMbps} Mbps
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">
                        Latency
                      </dt>
                      <dd className="text-sm font-bold">
                        ≤{p.boost.maxLatencyMs} ms
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] text-muted-foreground">
                        Hours
                      </dt>
                      <dd className="text-sm font-bold">{p.boostHours}/mo</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <p className="text-sm text-muted-foreground">
                      <span className="tabular text-lg font-bold text-ink">
                        {formatUSD(p.price)}
                      </span>
                      /month
                    </p>
                    <Link
                      href={`/subscribe?plan=${id}`}
                      className="text-sm font-semibold text-ink underline underline-offset-4 hover:text-brand-red"
                      aria-label={`Subscribe to the ${p.name} plan`}
                    >
                      Subscribe
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-20" aria-labelledby="how-heading">
        <Container>
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <SectionIntro
              id="how-heading"
              eyebrow="How it works"
              title="Like a phone plan, with a guarantee."
            />
            <Link
              href="/subscribe"
              className={buttonVariants({ variant: "outline" })}
            >
              Try signing up
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

      {/* Why not give everyone a slice? */}
      <section
        className="border-t border-gray-mid bg-ink py-20 text-white"
        aria-labelledby="fair-heading"
      >
        <Container>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-red">
              The obvious question
            </p>
            <h2
              id="fair-heading"
              className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-balance sm:text-4xl"
            >
              If everyone gets a slice, isn&apos;t it just normal 5G?
            </h2>
            <p className="mt-4 text-lg text-[#c9cbcb]">
              It would be, if nothing limited it. Priority only means something
              when it&apos;s scarce, so Priority 5G is built around four rules.
            </p>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Scale,
                title: "Guarantees are capped",
                body: `Each cell gives guarantees at most ${formatPct(cap)} of its capacity. Regular users always keep the other ${formatPct(1 - cap)}.`,
              },
              {
                icon: ListChecks,
                title: "Seats are limited",
                body: "Each plan type gets its own share of that pool. When a share is full on a cell, new sign-ups join a waitlist.",
              },
              {
                icon: Clock,
                title: "Guarantees are time-boxed",
                body: "Day to day you get priority. The full guarantee runs only during boost hours, so only a few subscribers boost at once.",
              },
              {
                icon: Ban,
                title: "No silent slowdowns",
                body: "If a boost won't fit, it's refused with the next open time. It never starts and then runs slowly.",
              },
            ].map((r, i) => (
              <li
                key={r.title}
                className="rounded-lg border border-white/15 bg-white/5 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="tabular text-sm font-bold text-brand-red">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <r.icon className="size-5 text-white" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-lg font-bold">{r.title}</h3>
                <p className="mt-2 text-sm text-[#c9cbcb]">{r.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-6 rounded-lg border border-white/15 p-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-3xl text-sm text-[#c9cbcb]">
              <span className="font-semibold text-white">
                Example (illustrative):
              </span>{" "}
              a 3,000 Mbps campus cell reserves {formatInt(3000 * cap)} Mbps for
              guarantees. Organizations get {formatInt(examplePool)} Mbps of
              that, enough for about{" "}
              {Math.floor(
                examplePool / PLANS.organization.boost.throughputMbps
              )}{" "}
              Organization boosts at once. If about 1 in 10 boosts at the same
              time, that cell can sell about{" "}
              {Math.floor(
                examplePool /
                  (PLANS.organization.boost.throughputMbps *
                    PLANS.organization.peakConcurrency)
              )}{" "}
              Organization plans before the waitlist opens.
            </p>
            <Link
              href="/demo#density"
              className={cn(buttonVariants(), "shrink-0")}
            >
              See it in the demo
              <ArrowRight />
            </Link>
          </div>
        </Container>
      </section>

      {/* Business value */}
      <section className="bg-gray-light py-20" aria-labelledby="value-heading">
        <Container>
          <SectionIntro
            id="value-heading"
            eyebrow="Why it matters"
            title="Recurring revenue from the slicing portfolio that already exists."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Repeat,
                metric: formatUSDCompact(business.yearOneRevenue),
                metricLabel: `simulated year-one revenue, ${DEFAULT_ASSUMPTIONS.numberOfSites} sites`,
                title: "Recurring revenue",
                body: "Monthly plans across four customer types instead of one-off enterprise deals.",
                accent: true,
              },
              {
                icon: Gauge,
                metric: formatPct(upgradeShare),
                metricLabel: "simulated share of revenue from upgrades",
                title: "Upgrade revenue",
                body: "Speed tiers and extra boost hours grow revenue per subscriber over time.",
                accent: true,
              },
              {
                icon: ShieldCheck,
                metric: formatPct(1 - cap),
                metricLabel: "of every cell always kept for regular users",
                title: "Fair by design",
                body: "Caps and waitlists keep the guarantee real without squeezing out everyone else.",
                accent: false,
              },
              {
                icon: Layers,
                metric: formatInt(enterpriseLeads),
                metricLabel: "simulated enterprise leads per year",
                title: "Enterprise pipeline",
                body: "Organizations and businesses that outgrow a plan are qualified leads for enterprise slicing.",
                accent: true,
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
                    v.accent ? "text-brand-red" : "text-ink"
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
            Figures are simulated from the business model&apos;s default
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
      <section className="border-t border-gray-mid bg-white py-16">
        <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
              Watch a boost hold during a crowd surge.
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              A 30-second simulation of a packed venue, regular network vs. a
              Priority 5G boost.
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
