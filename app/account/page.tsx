import type { Metadata } from "next"

import { AccountLoader } from "@/components/account/account-loader"
import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"
import { SimulatedTag } from "@/components/simulated-tag"

export const metadata: Metadata = { title: "Account" }

export default function AccountPage() {
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your Priority 5G account"
        description="Start a boost when it matters, watch your hours, and upgrade for more speed or time. Try 7 PM at a busy cell to see a boost refused instead of degraded."
      >
        <SimulatedTag>Simulated account. Illustrative values.</SimulatedTag>
      </PageHeader>
      <Container className="py-8 sm:py-10">
        <AccountLoader />
      </Container>
    </>
  )
}
