import { Eye, FileLock2, KeyRound, Lock, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"

import { ArchitectureDiagram } from "@/components/architecture/architecture-diagram"
import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Architecture" }

const PRIVACY = [
  {
    icon: Eye,
    title: "No content inspection",
    body: "Monitoring uses network performance counters only: latency, throughput, and loss per slice. We never inspect what customers send.",
  },
  {
    icon: KeyRound,
    title: "Scoped access",
    body: "Each booking gets its own API credentials. Customers can see telemetry for their own slices and nothing else.",
  },
  {
    icon: Lock,
    title: "Isolation by design",
    body: "Each slice runs on reserved radio and core resources, so traffic from one customer can't affect another's.",
  },
  {
    icon: FileLock2,
    title: "Minimal data",
    body: "Booking needs only a contact and a payment method. Telemetry is aggregated after 30 days. This demo stores nothing; it all runs in your browser.",
  },
]

export default function ArchitecturePage() {
  return (
    <>
      <PageHeader
        eyebrow="Architecture"
        title="From booking to a guaranteed slice"
        description="A booking moves through pricing, a capacity check, and provisioning before the 5G core enforces it. Monitoring then checks the guarantee for its whole duration."
      />

      <Container className="py-12 sm:py-16">
        <section aria-labelledby="flow-heading">
          <h2 id="flow-heading" className="sr-only">
            Request flow
          </h2>
          <div className="rounded-xl border border-gray-mid bg-white p-5 shadow-card sm:p-8 lg:p-10">
            <ArchitectureDiagram />
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-5 rounded-sm border-[1.5px] border-ink"
                aria-hidden="true"
              />
              Built in this prototype
            </span>
            <span className="flex items-center gap-2">
              <span
                className="h-3 w-5 rounded-sm border-[1.5px] border-dashed border-gray-dark bg-gray-light"
                aria-hidden="true"
              />
              Simulated (no real network access)
            </span>
            <span className="flex items-center gap-2">
              <span
                className="size-3 rounded-full bg-brand-red"
                aria-hidden="true"
              />
              Customer-facing
            </span>
          </div>
        </section>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section
            aria-labelledby="privacy-heading"
            className="rounded-lg border border-gray-mid bg-white p-6 shadow-card sm:p-8"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-ink text-white">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2
                id="privacy-heading"
                className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
              >
                Privacy and security
              </h2>
            </div>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2">
              {PRIVACY.map((p) => (
                <li key={p.title}>
                  <p className="flex items-center gap-2 font-semibold text-ink">
                    <p.icon
                      className="size-4 text-brand-red"
                      aria-hidden="true"
                    />
                    {p.title}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {p.body}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="real-heading"
            className="rounded-lg bg-gray-light p-6 sm:p-8"
          >
            <h2 id="real-heading" className="text-lg font-bold text-ink">
              Prototype vs. production
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-ink">In this prototype</dt>
                <dd className="mt-1 text-muted-foreground">
                  The booking UI, pricing engine, capacity check, and monitoring
                  views. All of them run on a seeded simulation in the browser.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Simulated</dt>
                <dd className="mt-1 text-muted-foreground">
                  Slice provisioning, the 5G core, and every network
                  measurement. No real network is contacted.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">In production</dt>
                <dd className="mt-1 text-muted-foreground">
                  Provisioning would go through the operator&apos;s
                  network-exposure layer, for example 3GPP NEF with CAMARA-style
                  network slice booking and quality-on-demand APIs. It would run
                  on a standalone 5G core with slice-aware RAN scheduling.
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </Container>
    </>
  )
}
