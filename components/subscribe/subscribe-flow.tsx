"use client"

import { ArrowLeft, ArrowRight, CircleCheck, Clock } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { StepWizard, type WizardStep } from "@/components/step-wizard"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  CELLS,
  PLAN_ORDER,
  PLANS,
  SPEED_TIER_ORDER,
  SPEED_TIERS,
  type DeviceTypeId,
  type PlanId,
} from "@/lib/config"
import { formatUSDCents } from "@/lib/format"
import { hashString } from "@/lib/random"
import {
  accountReference,
  boostProfile,
  checkEligibility,
  getCell,
  monthlyPrice,
  seatAvailability,
  type Subscription,
} from "@/lib/simulate"

import { PricePanel } from "./price-panel"
import {
  StepCustomize,
  StepEligibility,
  StepPlan,
  StepReview,
} from "./subscribe-steps"

const STEPS: WizardStep[] = [
  { id: "plan", label: "Plan", description: "Who it's for" },
  {
    id: "eligibility",
    label: "Eligibility",
    description: "Coverage and devices",
  },
  { id: "customize", label: "Speed & time", description: "Upgrades and seats" },
  { id: "confirm", label: "Confirm", description: "Review and start" },
]

const LAST_STEP = STEPS.length - 1

/** Typical starting point for each plan, so the demo tells a realistic story */
const DEFAULTS: Record<PlanId, { cellId: string; deviceId: DeviceTypeId }> = {
  individual: { cellId: "residence-halls", deviceId: "sa-phone" },
  family: { cellId: "stadium", deviceId: "nsa-phone" },
  "small-business": { cellId: "food-truck-row", deviceId: "lte-pos" },
  organization: { cellId: "stadium", deviceId: "bonded-encoder" },
}

/** Plan preselected by /subscribe?plan=<id> from the plans page */
function initialPlanFromUrl(): PlanId {
  const id = new URLSearchParams(window.location.search).get("plan")
  return PLAN_ORDER.find((p) => p === id) ?? "individual"
}

function initialSubscription(): Subscription {
  const plan = initialPlanFromUrl()
  return {
    plan,
    speed: "standard",
    extraHours: 0,
    cellId: DEFAULTS[plan].cellId,
  }
}

export function SubscribeFlow() {
  // Rendered client-only (see subscribe-loader), so reading the URL is safe.
  const [sub, setSub] = useState<Subscription>(initialSubscription)
  const [deviceId, setDeviceId] = useState<DeviceTypeId>(
    () => DEFAULTS[sub.plan].deviceId
  )
  const [step, setStep] = useState(0)
  const [done, setDone] = useState<"active" | "waitlist" | null>(null)

  const update = (patch: Partial<Subscription>) =>
    setSub((s) => ({ ...s, ...patch }))
  const changePlan = (plan: PlanId) => {
    setDeviceId(DEFAULTS[plan].deviceId)
    setSub((s) => ({ ...s, plan, cellId: DEFAULTS[plan].cellId }))
  }

  const seats = seatAvailability(sub)
  const ineligible = checkEligibility(sub.cellId, deviceId).some(
    (r) => r.status === "fail"
  )
  const lowerTierWithSeats =
    SPEED_TIER_ORDER.slice(0, SPEED_TIER_ORDER.indexOf(sub.speed))
      .reverse()
      .find((t) => !seatAvailability({ ...sub, speed: t }).soldOut) ?? null
  const cellWithSeats =
    CELLS.filter((c) => c.id !== sub.cellId && c.saCoverage !== "none")
      .map((c) => ({
        id: c.id,
        open: seatAvailability({ ...sub, cellId: c.id }).open,
      }))
      .sort((a, b) => b.open - a.open)
      .find((c) => c.open > 0)?.id ?? null

  const blockReason =
    step === 1 && ineligible
      ? "Resolve the failed check above to continue."
      : null
  const price = monthlyPrice(sub)

  if (done) {
    return (
      <Confirmation
        sub={sub}
        waitlist={done === "waitlist"}
        onRestart={() => {
          setDone(null)
          setStep(0)
        }}
      />
    )
  }

  return (
    <StepWizard steps={STEPS} current={step} onStepSelect={(i) => setStep(i)}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div>
          {step === 0 ? (
            <StepPlan plan={sub.plan} onPlanChange={changePlan} />
          ) : step === 1 ? (
            <StepEligibility
              cellId={sub.cellId}
              deviceId={deviceId}
              onCellChange={(cellId) => update({ cellId })}
              onDeviceChange={setDeviceId}
            />
          ) : step === 2 ? (
            <StepCustomize
              sub={sub}
              seats={seats}
              lowerTierWithSeats={lowerTierWithSeats}
              cellWithSeats={cellWithSeats}
              onSpeedChange={(speed) => update({ speed })}
              onExtraHoursChange={(extraHours) => update({ extraHours })}
              onCellChange={(cellId) => update({ cellId })}
            />
          ) : (
            <StepReview
              sub={sub}
              deviceId={deviceId}
              waitlist={seats.soldOut}
            />
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
                disabled={blockReason !== null}
                aria-describedby={blockReason ? "block-reason" : undefined}
                onClick={() =>
                  step < LAST_STEP
                    ? setStep((s) => s + 1)
                    : setDone(seats.soldOut ? "waitlist" : "active")
                }
              >
                {step === 0
                  ? "Check eligibility"
                  : step === 1
                    ? "Choose speed and time"
                    : step === 2
                      ? seats.soldOut
                        ? "Continue to waitlist"
                        : "Review subscription"
                      : seats.soldOut
                        ? "Join the waitlist"
                        : `Start subscription · ${formatUSDCents(price.total)}/mo`}
                {step < LAST_STEP ? <ArrowRight /> : null}
              </Button>
              {blockReason ? (
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
          <PricePanel sub={sub} />
        </div>
      </div>
    </StepWizard>
  )
}

function Confirmation({
  sub,
  waitlist,
  onRestart,
}: {
  sub: Subscription
  waitlist: boolean
  onRestart: () => void
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [])
  const plan = PLANS[sub.plan]
  const price = monthlyPrice(sub)
  const boost = boostProfile(sub.plan, sub.speed)
  const cell = getCell(sub.cellId)
  const id = accountReference(JSON.stringify(sub))
  const position = (hashString(id) % 40) + 3
  const accountHref = `/account?plan=${sub.plan}&speed=${sub.speed}&extra=${sub.extraHours}&cell=${sub.cellId}`

  return (
    <div className="mx-auto max-w-2xl animate-in py-6 text-center duration-500 zoom-in-95 fade-in">
      <div
        className={
          waitlist
            ? "mx-auto flex size-20 items-center justify-center rounded-full bg-gray-light"
            : "mx-auto flex size-20 items-center justify-center rounded-full bg-success-tint"
        }
      >
        {waitlist ? (
          <Clock className="size-10 text-ink" aria-hidden="true" />
        ) : (
          <CircleCheck className="size-10 text-success" aria-hidden="true" />
        )}
      </div>
      <h2
        ref={ref}
        tabIndex={-1}
        className="mt-6 text-4xl font-extrabold tracking-[-0.03em] text-ink outline-none"
      >
        {waitlist ? "You're on the waitlist" : "Subscription active"}
      </h2>
      <p className="mt-3 text-lg text-muted-foreground" role="status">
        {waitlist
          ? `${plan.name} ${SPEED_TIERS[sub.speed].name} is full on ${cell.name}. You're number ${position} in line, and we'll start your plan when a seat opens.`
          : `Your ${plan.name} plan is active on ${cell.name}. Everyday priority starts now, and you have ${price.boostHours} boost hours this month.`}
      </p>
      <dl className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-mid bg-gray-mid text-left sm:grid-cols-4">
        {[
          ["Account ID", id],
          ["Boost", `${boost.throughputMbps} Mbps`],
          ["Hours", `${price.boostHours}/mo`],
          ["Monthly", formatUSDCents(price.total)],
        ].map(([k, v]) => (
          <div key={k} className="bg-white p-4">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="tabular mt-0.5 font-bold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm text-muted-foreground">
        This is a simulated confirmation. No real network is contacted. In
        production, your plan would be applied through the operator&apos;s
        orchestration systems.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {waitlist ? null : (
          <Link href={accountHref} className={buttonVariants({ size: "lg" })}>
            Go to your account
            <ArrowRight />
          </Link>
        )}
        <Button size="lg" variant="outline" onClick={onRestart}>
          {waitlist ? "Try another option" : "Start over"}
        </Button>
      </div>
    </div>
  )
}
