import { ArrowRight, Check, Users } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"
import { buttonVariants } from "@/components/ui/button"
import { PACKAGE_ORDER, PACKAGES, PRICING } from "@/lib/config"
import { formatUSD } from "@/lib/format"
import { profileMultiplier } from "@/lib/simulate"

export const metadata: Metadata = { title: "Slice catalog" }

export default function CatalogPage() {
  const offPeak = PRICING.demandBands["off-peak"].multiplier
  const peak = PRICING.demandBands.peak.multiplier

  return (
    <>
      <PageHeader
        eyebrow="Catalog"
        title="Slice packages"
        description="Four starting points for common campus needs. Each one is a pre-tuned slice profile you can adjust when you book."
      />
      <Container className="py-12 sm:py-16">
        <ul className="grid gap-6 md:grid-cols-2">
          {PACKAGE_ORDER.map((id) => {
            const pkg = PACKAGES[id]
            const mult = profileMultiplier(pkg.profile)
            const from = PRICING.baseHourlyRate * offPeak * mult
            const to = PRICING.baseHourlyRate * peak * mult
            return (
              <li
                key={id}
                className="flex flex-col rounded-lg border border-gray-mid bg-white p-6 shadow-card transition-shadow duration-200 hover:shadow-raised sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink">
                    {pkg.name}
                  </h2>
                  <span className="rounded-full border border-gray-mid px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                    Illustrative profile
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">{pkg.tagline}</p>

                <dl className="tabular mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid sm:grid-cols-4">
                  {[
                    [
                      "Guaranteed throughput",
                      `${pkg.profile.throughputMbps}`,
                      "Mbps",
                    ],
                    ["Max latency", `${pkg.profile.maxLatencyMs}`, "ms"],
                    ["Reliability target", `${pkg.profile.reliability}`, "%"],
                    [
                      "Typical duration",
                      `${pkg.typicalHours.min}–${pkg.typicalHours.max}`,
                      "h",
                    ],
                  ].map(([label, value, unit]) => (
                    <div key={label} className="bg-white p-3">
                      <dt className="text-[11px] leading-tight text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 text-xl font-extrabold text-ink">
                        {value}
                        <span className="ml-0.5 text-xs font-semibold text-muted-foreground">
                          {unit}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-6 flex gap-2 text-sm">
                  <Users
                    className="mt-0.5 size-4 shrink-0 text-ink"
                    aria-hidden="true"
                  />
                  <p>
                    <span className="font-semibold text-ink">
                      Ideal customer:{" "}
                    </span>
                    <span className="text-muted-foreground">
                      {pkg.idealCustomer}
                    </span>
                  </p>
                </div>
                <ul className="mt-4 mb-8 space-y-1.5 text-sm text-ink">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-brand-red"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-gray-mid pt-5">
                  <p className="text-sm text-muted-foreground">
                    <span className="tabular text-lg font-bold text-ink">
                      {formatUSD(from)}–{formatUSD(to)}
                    </span>{" "}
                    per hour
                    <span className="block text-xs">
                      Simulated, off-peak to peak weekday
                    </span>
                  </p>
                  <Link
                    href={`/book?package=${id}`}
                    className={buttonVariants()}
                    aria-label={`Book the ${pkg.name} package`}
                  >
                    Book this package
                    <ArrowRight />
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-8 max-w-3xl text-sm text-muted-foreground">
          These packages are illustrative profiles for this concept, not real
          products. Prices come from the simulated pricing engine: base rate ×
          demand multiplier × profile multiplier. Throughput, latency, and
          reliability can all be fine-tuned during booking.
        </p>
      </Container>
    </>
  )
}
