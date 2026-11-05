import Link from "next/link"

import { cn } from "@/lib/utils"

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="Priority 5G home (concept demo)"
    >
      <span className="text-[22px] leading-none font-extrabold tracking-[-0.03em] whitespace-nowrap text-ink">
        Priority <span className="text-brand-red">5G</span>
      </span>
      <span className="hidden rounded-sm border border-gray-mid px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase sm:inline">
        Concept demo
      </span>
    </Link>
  )
}
