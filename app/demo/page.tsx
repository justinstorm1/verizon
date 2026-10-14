import type { Metadata } from "next"

import { DemoLoader } from "@/components/demo/demo-loader"
import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Live demo" }

export default function DemoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Live demo · simulated"
        title="Stadium crowd surge: standard network vs. slice"
        description="Start a surge and watch thousands of phones join one cell. The shared network slows down. The sliced connection stays within its guarantee."
      />
      <Container className="py-8 sm:py-10">
        <DemoLoader />
      </Container>
    </>
  )
}
