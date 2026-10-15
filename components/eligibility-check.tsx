import { CircleCheck, CircleX, LoaderCircle, TriangleAlert } from "lucide-react"

import type { CheckStatus, EligibilityResult } from "@/lib/simulate"
import { cn } from "@/lib/utils"

const STATUS: Record<
  CheckStatus,
  {
    label: string
    Icon: typeof CircleCheck
    className: string
    iconClass: string
  }
> = {
  pass: {
    label: "Pass",
    Icon: CircleCheck,
    className: "border-success/30 bg-success-tint",
    iconClass: "text-success",
  },
  warn: {
    label: "Pass with a note",
    Icon: TriangleAlert,
    className: "border-warning/30 bg-warning-tint",
    iconClass: "text-warning",
  },
  fail: {
    label: "Not eligible",
    Icon: CircleX,
    className: "border-danger/30 bg-danger-tint",
    iconClass: "text-danger",
  },
}

/**
 * List of simulated eligibility checks. Each result shows pass / warn / fail
 * with an icon and a text label (never color alone), plus a fix when one exists.
 */
export function EligibilityCheck({
  results,
  checking,
  onFix,
}: {
  results: EligibilityResult[]
  checking: boolean
  onFix?: (fix: NonNullable<EligibilityResult["fix"]>) => void
}) {
  return (
    <ul className="space-y-3" aria-busy={checking}>
      {results.map((r) => {
        const s = STATUS[r.status]
        return (
          <li
            key={r.id}
            className={cn(
              "rounded-lg border p-4 transition-colors duration-300",
              checking ? "border-gray-mid bg-white" : s.className
            )}
          >
            <div className="flex gap-3">
              {checking ? (
                <LoaderCircle
                  className="mt-0.5 size-5 shrink-0 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <s.Icon
                  className={cn("mt-0.5 size-5 shrink-0", s.iconClass)}
                  aria-hidden="true"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="font-semibold text-ink">{r.title}</p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      checking ? "text-muted-foreground" : s.iconClass
                    )}
                  >
                    {checking ? "Checking…" : s.label}
                  </p>
                </div>
                {!checking ? (
                  <>
                    <p className="mt-1 text-sm text-ink/80">{r.detail}</p>
                    {r.status === "fail" && r.fix && onFix ? (
                      <button
                        type="button"
                        onClick={() => onFix(r.fix!)}
                        className="mt-2 text-sm font-semibold text-ink underline underline-offset-4 hover:text-brand-red"
                      >
                        {r.fix.label}
                      </button>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
