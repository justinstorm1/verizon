"use client"

import { Check } from "lucide-react"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export interface WizardStep {
  id: string
  label: string
  description?: string
}

export interface StepWizardProps {
  steps: WizardStep[]
  current: number
  /** Called when a completed step is clicked. Omit to disable jumping back. */
  onStepSelect?: (index: number) => void
  children: React.ReactNode
  className?: string
}

/**
 * Step indicator plus the active panel. Focus moves to the panel heading when
 * the step changes so keyboard and screen-reader users land on the new content.
 */
export function StepWizard({
  steps,
  current,
  onStepSelect,
  children,
  className,
}: StepWizardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousStep = useRef(current)

  useEffect(() => {
    if (previousStep.current === current) return
    previousStep.current = current
    panelRef.current?.focus({ preventScroll: true })
    rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [current])

  return (
    <div ref={rootRef} className={cn("scroll-mt-24", className)}>
      <nav aria-label="Booking progress">
        <ol
          className="grid gap-2 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
          }}
        >
          {steps.map((step, i) => {
            const done = i < current
            const active = i === current
            const clickable = done && !!onStepSelect
            const content = (
              <>
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                    active && "border-ink bg-ink text-white",
                    done && "border-ink bg-white text-ink",
                    !active &&
                      !done &&
                      "border-gray-mid bg-white text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className="w-full min-w-0 text-left">
                  <span className="sr-only">
                    Step {i + 1} of {steps.length}
                    {done ? ", completed" : ""}:{" "}
                  </span>
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      active || done ? "text-ink" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description ? (
                    <span className="hidden truncate text-xs text-muted-foreground sm:block">
                      {step.description}
                    </span>
                  ) : null}
                </span>
              </>
            )
            return (
              <li
                key={step.id}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "border-t-[3px] pt-3 transition-colors",
                  active
                    ? "border-brand-red"
                    : done
                      ? "border-ink"
                      : "border-gray-mid"
                )}
              >
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onStepSelect(i)}
                    className="flex w-full flex-col items-start gap-2 rounded-md hover:opacity-80 sm:flex-row sm:items-center sm:gap-3"
                  >
                    {content}
                  </button>
                ) : (
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      <div
        ref={panelRef}
        tabIndex={-1}
        className="mt-8 outline-none"
        aria-label={`Step ${current + 1}: ${steps[current]?.label}`}
        role="region"
      >
        <div
          key={current}
          className="animate-in duration-300 fade-in slide-in-from-bottom-1"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
