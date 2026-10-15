import { FlaskConical } from "lucide-react"

import { cn } from "@/lib/utils"

/** Visible reminder that a page or chart shows simulated, illustrative values. */
export function SimulatedTag({
  children = "Simulated network. Illustrative values.",
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-gray-mid bg-gray-light px-3 py-1.5 text-sm font-semibold text-ink",
        className
      )}
    >
      <FlaskConical className="size-4 text-brand-red" aria-hidden="true" />
      {children}
    </p>
  )
}
