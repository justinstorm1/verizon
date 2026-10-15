"use client"

import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"

import { StepWizard, type WizardStep } from "@/components/step-wizard"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  BOOKING,
  USE_CASE_ORDER,
  USE_CASES,
  type DeviceTypeId,
  type SliceProfile,
  type UseCaseId,
} from "@/lib/config"
import { formatDateLong, formatUSD } from "@/lib/format"
import {
  availableAlternative,
  bookingReference,
  cheaperAlternative,
  checkEligibility,
  getVenue,
  hourLabel,
  quoteBooking,
  type BookingRequest,
} from "@/lib/simulate"

import {
  StepDetails,
  StepEligibility,
  StepProfile,
  StepReview,
} from "./booking-steps"
import { QuotePanel } from "./quote-panel"

const STEPS: WizardStep[] = [
  { id: "details", label: "Details", description: "Location, time, use case" },
  {
    id: "eligibility",
    label: "Eligibility",
    description: "Coverage and devices",
  },
  {
    id: "profile",
    label: "Slice & price",
    description: "Guarantee and live quote",
  },
  { id: "confirm", label: "Confirm", description: "Review and schedule" },
]

const LAST_STEP = STEPS.length - 1

/** Typical device for each use case, so the eligibility step tells a realistic story */
const DEFAULT_DEVICE: Record<UseCaseId, DeviceTypeId> = {
  livestream: "bonded-encoder",
  "food-trucks": "lte-pos",
  esports: "sa-phone",
  "popup-retail": "lte-pos",
  "safety-comms": "sa-hotspot",
}

/** Use case preselected by /book?package=<id> from the catalog */
function initialUseCaseFromUrl(): UseCaseId {
  const pkg = new URLSearchParams(window.location.search).get("package")
  return (
    USE_CASE_ORDER.find((id) => USE_CASES[id].packageId === pkg) ?? "livestream"
  )
}

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

function defaultRequest(dateISO: string, useCase: UseCaseId): BookingRequest {
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
    defaultRequest(
      toISODate(upcomingSaturday(new Date())),
      initialUseCaseFromUrl()
    )
  )
  const [deviceId, setDeviceId] = useState<DeviceTypeId>(
    () => DEFAULT_DEVICE[request.useCase]
  )
  const [step, setStep] = useState(0)
  const [confirmed, setConfirmed] = useState(false)

  const quote = useMemo(() => quoteBooking(request), [request])
  const alternative = useMemo(
    () => (step === 2 ? cheaperAlternative(request, quote) : null),
    [request, quote, step]
  )
  const availableTime = useMemo(
    () => (quote.oversold ? availableAlternative(request) : null),
    [request, quote]
  )
  const eligibility = checkEligibility(request.venueId, deviceId)
  const ineligible = eligibility.some((r) => r.status === "fail")

  const update = (patch: Partial<BookingRequest>) =>
    setRequest((r) => ({ ...r, ...patch }))
  const updateProfile = (patch: Partial<SliceProfile>) =>
    setRequest((r) => ({ ...r, profile: { ...r.profile, ...patch } }))
  const changeUseCase = (id: UseCaseId) => {
    setDeviceId(DEFAULT_DEVICE[id])
    setRequest((r) => ({
      ...r,
      useCase: id,
      profile: { ...USE_CASES[id].recommended },
      durationHours: Math.min(
        USE_CASES[id].typicalHours,
        BOOKING.latestEndHour - r.startHour
      ),
    }))
  }

  const dateInvalid = !request.dateISO || request.dateISO < today
  const blockReason =
    step === 0 && dateInvalid
      ? "Choose today or a future date."
      : step === 1 && ineligible
        ? "Resolve the failed check above to continue."
        : step >= 2 && quote.oversold
          ? "This booking would oversell the site. Move to another time or lower throughput."
          : null
  const blocked = blockReason !== null

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
            ["Booking ID", bookingReference(request)],
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
          This is a simulated confirmation. No real network is contacted. In
          production, the request would go to the operator&apos;s slice
          orchestration systems, and you&apos;d get a live monitoring link at
          activation.
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
            <StepEligibility
              request={request}
              deviceId={deviceId}
              onDeviceChange={setDeviceId}
              onVenueChange={(venueId) => update({ venueId })}
            />
          ) : step === 2 ? (
            <StepProfile
              request={request}
              quote={quote}
              availableTime={availableTime}
              onStartHourChange={(startHour) => update({ startHour })}
              onProfileChange={updateProfile}
              onReset={() =>
                setRequest((r) => ({
                  ...r,
                  profile: { ...USE_CASES[r.useCase].recommended },
                }))
              }
            />
          ) : (
            <StepReview request={request} quote={quote} deviceId={deviceId} />
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
                  step < LAST_STEP ? setStep((s) => s + 1) : setConfirmed(true)
                }
              >
                {step === 0
                  ? "Check eligibility"
                  : step === 1
                    ? "See recommended slice"
                    : step === 2
                      ? "Review booking"
                      : `Confirm booking · ${formatUSD(quote.total)}`}
                {step < LAST_STEP ? <ArrowRight /> : null}
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
            alternative={step === 2 ? alternative : null}
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
