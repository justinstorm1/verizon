import type { Metadata } from "next"

import { DemoLoader, DensityLoader } from "@/components/demo/demo-loader"
import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"
import { SimulatedTag } from "@/components/simulated-tag"

export const metadata: Metadata = { title: "Live demo" }

export default function DemoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live demo"
        title="Crowd surge: regular network vs. a Priority 5G boost"
        description="Start a surge and watch thousands of phones join one cell. The regular network slows down. A subscriber's boost stays inside its guarantee."
      >
        <SimulatedTag />
      </PageHeader>
      <Container className="space-y-16 py-8 sm:py-10">
        <DemoLoader />
        <section
          id="density"
          aria-labelledby="density-heading"
          className="scroll-mt-24"
        >
          <p className="text-sm font-semibold text-brand-red">
            The obvious question
          </p>
          <h2
            id="density-heading"
            className="mt-2 text-3xl font-extrabold tracking-[-0.03em] text-ink"
          >
            If everyone gets priority, isn&apos;t it just normal 5G?
          </h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Yes, if nothing limits it. That&apos;s why every cell caps how much
            capacity guarantees can use and stops selling seats once that cap is
            reached. Move the slider and switch admission control off to see the
            difference.
          </p>
          <div className="mt-8">
            <DensityLoader />
          </div>
        </section>
      </Container>
    </>
  )
}
