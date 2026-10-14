import { CircleCheck, CircleX, Clock, Radio } from "lucide-react"

import { cn } from "@/lib/utils"

export type SliceStatus = "active" | "scheduled" | "met" | "breached"

const STYLES: Record<
  SliceStatus,
  { label: string; className: string; Icon: typeof Radio }
> = {
  active: {
    label: "Active",
    className: "border-brand-red/30 bg-[#fff1f1] text-brand-red-dark",
    Icon: Radio,
  },
  scheduled: {
    label: "Scheduled",
    className: "border-gray-mid bg-gray-light text-ink",
    Icon: Clock,
  },
  met: {
    label: "Guarantee met",
    className: "border-success/30 bg-success-tint text-success",
    Icon: CircleCheck,
  },
  breached: {
    label: "Guarantee breached",
    className: "border-danger/30 bg-danger-tint text-danger",
    Icon: CircleX,
  },
}

/** Status pill for a slice. Always icon + text, never color alone. */
export function SliceBadge({
  status,
  label,
  className,
}: {
  status: SliceStatus
  label?: string
  className?: string
}) {
  const s = STYLES[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        s.className,
        className
      )}
    >
      <s.Icon className="size-3.5" aria-hidden="true" />
      {label ?? s.label}
    </span>
  )
}
