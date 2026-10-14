"use client"

import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

import { StepWizard, type WizardStep } from "@/components/step-wizard"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  BOOKING,
  USE_CASES,
  type SliceProfile,
  type UseCaseId,
} from "@/lib/config"
import { formatDateLong, formatUSD } from "@/lib/format"
import {
  bookingReference,
  cheaperAlternative,
  getVenue,
  hourLabel,
  quoteBooking,
  type BookingRequest,
} from "@/lib/simulate"

import { StepDetails, StepProfile, StepReview } from "./booking-steps"
import { QuotePanel } from "./quote-panel"

const STEPS: WizardStep[] = [
  { id: "details", label: "Details", description: "Location, time, use case" },
  {
    id: "profile",
    label: "Slice & price",
    description: "Guarantee and live quote",
  },
  { id: "confirm", label: "Confirm", description: "Review and schedule" },
]

function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function upcomingSaturday(today: Date) {
  const d = new Date(today)
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7))
  return d
}

function defaultRequest(dateISO: string): BookingRequest {
  const useCase: UseCaseId = "livestream"
  return {
    venueId: "campus-green",
    dateISO,
    startHour: 18,
    durationHours: USE_CASES[useCase].typicalHours,
    useCase,
    profile: { ...USE_CASES[useCase].recommended },
  }
}

export function BookingFlow() {
  // Rendered client-only (see booking-flow-loader), so reading the clock is safe.
  const [today] = useState(() => toISODate(new Date()))
  const [request, setRequest] = useState<BookingRequest>(() =>
    defaultRequest(toISODate(upcomingSaturday(new Date())))
  )
  const [step, setStep] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  const quote = useMemo(() => quoteBooking(request), [request])
  const alternative = useMemo(
    () => (step >= 1 ? cheaperAlternative(request, quote) : null),
    [request, quote, step]
  )

  const update = (patch: Partial<BookingRequest>) =>
    setRequest((r) => ({ ...r, ...patch }))
  const updateProfile = (patch: Partial<SliceProfile>) =>
    setRequest((r) => ({ ...r, profile: { ...r.profile, ...patch } }))
  const changeUseCase = (id: UseCaseId) =>
    setRequest((r) => ({
      ...r,
      useCase: id,
      profile: { ...USE_CASES[id].recommended },
      durationHours: Math.min(
        USE_CASES[id].typicalHours,
        BOOKING.latestEndHour - r.startHour
      ),
    }))

  const dateInvalid = !request.dateISO || request.dateISO < today
  const blocked = (step === 0 && dateInvalid) || (step >= 1 && quote.oversold)
  const blockReason =
    step === 0 && dateInvalid
      ? "Choose today or a future date."
      : quote.oversold
        ? "This booking exceeds the site's available capacity. Adjust throughput or time to continue."
        : null

  if (confirmed) {
    const venue = getVenue(request.venueId)
    return (
      <div className="mx-auto max-w-2xl animate-in py-6 text-center duration-500 zoom-in-95 fade-in">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success-tint">
          <CircleCheck className="size-10 text-success" aria-hidden="true" />
        </div>
        <SuccessHeading />
        <p className="mt-3 text-lg text-muted-foreground" role="status">
          Your {USE_CASES[request.useCase].label.toLowerCase()} slice at{" "}
          {venue.name} is booked for {formatDateLong(request.dateISO)},{" "}
          {hourLabel(request.startHour)} to{" "}
          {hourLabel(request.startHour + request.durationHours)}.
        </p>
        <dl className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid text-left sm:grid-cols-4">
          {[
            ["Reference", bookingReference(request)],
            ["Throughput", `${request.profile.throughputMbps} Mbps`],
            ["Latency", `≤${request.profile.maxLatencyMs} ms`],
            ["Total", formatUSD(quote.total)],
          ].map(([k, v]) => (
            <div key={k} className="bg-white p-4">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="tabular mt-0.5 font-bold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-muted-foreground">
          Provisioning request queued with the slice orchestration API
          (simulated). You&apos;ll get a live monitoring link when the slice
          activates.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/demo" className={buttonVariants({ size: "lg" })}>
            See a slice under load
            <ArrowRight />
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              setConfirmed(false)
              setStep(0)
            }}
          >
            Book another slice
          </Button>
        </div>
      </div>
    )
  }

  return (
    <StepWizard steps={STEPS} current={step} onStepSelect={(i) => setStep(i)}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div>
          {step === 0 ? (
            <StepDetails
              request={request}
              minDate={today}
              onChange={update}
              onUseCaseChange={changeUseCase}
            />
          ) : step === 1 ? (
            <StepProfile
              request={request}
              quote={quote}
              onProfileChange={updateProfile}
              onReset={() =>
                setRequest((r) => ({
                  ...r,
                  profile: { ...USE_CASES[r.useCase].recommended },
                }))
              }
            />
          ) : (
            <StepReview request={request} quote={quote} />
          )}

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-gray-mid pt-6 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft />
                Back
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button
                size="lg"
                disabled={blocked}
                aria-describedby={
                  blocked && blockReason ? "block-reason" : undefined
                }
                onClick={() =>
                  step < 2 ? setStep((s) => s + 1) : setConfirmed(true)
                }
              >
                {step === 0
                  ? "See recommended slice"
                  : step === 1
                    ? "Review booking"
                    : `Confirm booking · ${formatUSD(quote.total)}`}
                {step < 2 ? <ArrowRight /> : null}
              </Button>
              {blocked && blockReason ? (
                <p
                  id="block-reason"
                  className="text-sm text-danger sm:text-right"
                >
                  {blockReason}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <QuotePanel
            request={request}
            quote={quote}
            alternative={step === 1 ? alternative : null}
            onApplyAlternative={(startHour) => update({ startHour })}
          />
        </div>
      </div>
    </StepWizard>
  )
}

/** Moves focus and scroll to the success message once it appears. */
function SuccessHeading() {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [])
  return (
    <h2
      ref={ref}
      tabIndex={-1}
      className="mt-6 text-4xl font-extrabold tracking-[-0.03em] text-ink outline-none"
    >
      Slice scheduled
    </h2>
  )
}
