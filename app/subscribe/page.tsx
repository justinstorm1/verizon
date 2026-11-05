import type { Metadata } from "next"

import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"
import { SubscribeLoader } from "@/components/subscribe/subscribe-loader"

export const metadata: Metadata = { title: "Subscribe" }

export default function SubscribePage() {
  return (
    <>
      <PageHeader
        eyebrow="Subscribe"
        title="Start your Priority 5G plan"
        description="Pick a plan, confirm your coverage and devices, then choose your speed and boost hours. Seats on each campus cell are limited, so the guarantee stays real."
      />
      <Container className="py-10 sm:py-14">
        <SubscribeLoader />
      </Container>
    </>
  )
}
