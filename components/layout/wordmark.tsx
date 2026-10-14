import Link from "next/link"

import { cn } from "@/lib/utils"

export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label="SliceLive home (concept demo)"
    >
      <span className="text-[22px] leading-none font-extrabold tracking-[-0.03em] text-ink">
        Slice<span className="text-brand-red">Live</span>
      </span>
      <span className="rounded-sm border border-gray-mid px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide text-muted-foreground uppercase">
        Concept demo
      </span>
    </Link>
  )
}
