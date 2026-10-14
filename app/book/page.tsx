import type { Metadata } from "next"

import { BookingFlowLoader } from "@/components/book/booking-flow-loader"
import { Container } from "@/components/layout/container"
import { PageHeader } from "@/components/layout/page-header"

export const metadata: Metadata = { title: "Book a slice" }

export default function BookPage() {
  return (
    <>
      <PageHeader
        eyebrow="Book"
        title="Book a guaranteed slice"
        description="Choose a venue and time, tune the guarantee, and see your price and the site's capacity update as you go."
      />
      <Container className="py-10 sm:py-14">
        <BookingFlowLoader />
      </Container>
    </>
  )
}
