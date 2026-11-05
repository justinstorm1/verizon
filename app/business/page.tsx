import type { Metadata } from "next"

import { BusinessLoader } from "@/components/business/business-loader"
import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Business case" }

export default function BusinessPage() {
  return (
    <>
      <PageHeader
        eyebrow="Business case · simulated"
        title="Recurring revenue, capped to keep the guarantee"
        description="Adjust the assumptions to see how subscribers, revenue, upgrades, and payback respond. Every figure on this page is computed from the inputs on the left."
      />
      <Container className="py-8 sm:py-10">
        <BusinessLoader />
      </Container>
    </>
  )
}
