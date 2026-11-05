import { ArrowRight, Check, Clock, Gauge, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"
import { PLAN_ICONS } from "@/components/plan-icon"
import { buttonVariants } from "@/components/ui/button"
import {
  CAPACITY,
  EXTRA_HOURS,
  PLAN_ORDER,
  PLANS,
  SPEED_TIER_ORDER,
  SPEED_TIERS,
} from "@/lib/config"
import { formatPct, formatUSD, formatUSDCents } from "@/lib/format"
import { boostProfile } from "@/lib/simulate"

export const metadata: Metadata = { title: "Plans" }

function everydayLabel(floorMbps: number) {
  return floorMbps ? `Priority + ${floorMbps} Mbps floor` : "Priority, no floor"
}

export default function PlansPage() {
  return (
    <>
      <PageHeader
        eyebrow="Plans"
        title="A plan for everyone on campus"
        description="Every plan includes everyday priority over regular traffic, plus monthly boost hours with a full speed and latency guarantee. Upgrade any time for more speed or more time."
      />

      <Container className="space-y-20 py-12 sm:py-16">
        {/* Plan cards */}
        <section aria-labelledby="plans-heading">
          <h2 id="plans-heading" className="sr-only">
            Plans
          </h2>
          <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const p = PLANS[id]
              const Icon = PLAN_ICONS[id]
              return (
                <li
                  key={id}
                  className="flex flex-col rounded-lg border border-gray-mid bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-raised"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-ink text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-gray-mid px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      Illustrative plan
                    </span>
                  </div>
                  <h3 className="mt-5 text-2xl font-extrabold tracking-[-0.02em] text-ink">
                    {p.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {p.tagline}
                  </p>
                  <p className="mt-5 flex items-baseline gap-1">
                    <span className="tabular text-4xl font-extrabold tracking-[-0.03em] text-ink">
                      {formatUSD(p.price)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /month
                    </span>
                  </p>
                  <dl className="mt-5 space-y-2.5 border-t border-gray-mid pt-5 text-sm">
                    {[
                      ["Everyday", everydayLabel(p.floorMbps)],
                      [
                        "Boost guarantee",
                        `${p.boost.throughputMbps} Mbps, ≤${p.boost.maxLatencyMs} ms`,
                      ],
                      ["Reliability", `${p.boost.reliability}%`],
                      ["Boost hours", `${p.boostHours} per month`],
                      ["Covers", p.devices.label],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="tabular text-right font-semibold text-ink">
                          {v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <ul className="mt-5 mb-6 space-y-1.5 text-sm text-ink">
                    {p.examples.map((e) => (
                      <li key={e} className="flex gap-2">
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-brand-red"
                          aria-hidden="true"
                        />
                        {e}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/subscribe?plan=${id}`}
                    className={buttonVariants({ className: "mt-auto w-full" })}
                    aria-label={`Subscribe to the ${p.name} plan`}
                  >
                    Subscribe
                    <ArrowRight />
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Upgrades */}
        <section aria-labelledby="upgrades-heading">
          <p className="text-sm font-semibold text-brand-red">Upgrades</p>
          <h2
            id="upgrades-heading"
            className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink"
          >
            Need more? Upgrade for speed or time.
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-gray-mid bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Gauge className="size-5 text-ink" aria-hidden="true" />
                <h3 className="text-lg font-bold text-ink">More speed</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Raise your boost guarantee with a speed tier, billed monthly.
                Change it any time.
              </p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <caption className="sr-only">
                    Speed tiers and their effect on each plan&apos;s boost
                    guarantee
                  </caption>
                  <thead>
                    <tr className="border-b border-gray-mid text-xs text-muted-foreground">
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Tier
                      </th>
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Boost speed
                      </th>
                      <th scope="col" className="py-2 pr-3 font-semibold">
                        Latency
                      </th>
                      <th scope="col" className="py-2 font-semibold">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-mid">
                    {SPEED_TIER_ORDER.map((t) => {
                      const tier = SPEED_TIERS[t]
                      return (
                        <tr key={t}>
                          <th
                            scope="row"
                            className="py-3 pr-3 font-semibold text-ink"
                          >
                            {tier.name}
                          </th>
                          <td className="tabular py-3 pr-3 text-ink">
                            {tier.throughputMultiplier}× plan speed
                          </td>
                          <td className="tabular py-3 pr-3 text-ink">
                            {tier.latencyReductionMs
                              ? `${tier.latencyReductionMs} ms lower`
                              : "Plan default"}
                          </td>
                          <td className="tabular py-3 text-ink">
                            {tier.priceUplift
                              ? `+${formatPct(tier.priceUplift)} of plan`
                              : "Included"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Example: Individual on Max boosts at{" "}
                {boostProfile("individual", "max").throughputMbps} Mbps, ≤
                {boostProfile("individual", "max").maxLatencyMs} ms. Latency
                never goes below 15 ms.
              </p>
            </div>

            <div className="min-w-0 rounded-lg border border-gray-mid bg-white p-6 shadow-card">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-ink" aria-hidden="true" />
                <h3 className="text-lg font-bold text-ink">More time</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Add boost hours every month, or top up once when a busy week
                comes along.
              </p>
              <dl className="mt-5 divide-y divide-gray-mid text-sm">
                {PLAN_ORDER.map((id) => (
                  <div key={id} className="flex justify-between gap-3 py-3">
                    <dt className="font-semibold text-ink">{PLANS[id].name}</dt>
                    <dd className="tabular text-ink">
                      {formatUSDCents(PLANS[id].extraHourPrice)} per extra hour
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Monthly add-ons from {EXTRA_HOURS.monthly.step} to{" "}
                {EXTRA_HOURS.monthly.max} hours. One-time top-ups of{" "}
                {EXTRA_HOURS.topUpPacks.join(", ")} hours from your account
                page.
              </p>
            </div>
          </div>
        </section>

        {/* Fair by design */}
        <section className="flex flex-col gap-6 rounded-lg bg-gray-light p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <ShieldCheck
              className="mt-1 size-6 shrink-0 text-ink"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-xl font-bold text-ink">
                Why some plans show a waitlist
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Guarantees only work if they&apos;re scarce. Each campus cell
                sets aside at most {formatPct(CAPACITY.guaranteedPoolCap)} of
                its capacity for guarantees and splits it between plan types.
                When a plan&apos;s share is full on your cell, new subscribers
                join a waitlist instead of slowing everyone down.
              </p>
            </div>
          </div>
          <Link
            href="/demo#density"
            className={buttonVariants({
              variant: "outline",
              className: "shrink-0",
            })}
          >
            See why in the demo
          </Link>
        </section>

        <p className="text-sm text-muted-foreground">
          Plans, prices, and guarantees are illustrative for this student
          concept. They aren&apos;t real products.
        </p>
      </Container>
    </>
  )
}
