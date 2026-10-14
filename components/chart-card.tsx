import { cn } from "@/lib/utils"

export interface ChartCardProps {
  title: string
  description?: string
  /** Controls or a legend rendered in the header row */
  actions?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function ChartCard({
  title,
  description,
  actions,
  footer,
  className,
  children,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-lg border border-gray-mid bg-white p-5 shadow-card sm:p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-[min(100%,16rem)] flex-1">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="max-w-full">{actions}</div> : null}
      </div>
      <div className="mt-5 flex-1">{children}</div>
      {footer ? (
        <div className="mt-4 border-t border-gray-light pt-3 text-xs text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </section>
  )
}

/** Legend entries; identity never relies on color alone (line style differs too). */
export function ChartLegend({
  items,
}: {
  items: { label: string; color: string; dashed?: boolean }[]
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <svg width="20" height="8" aria-hidden="true">
            <line
              x1="1"
              y1="4"
              x2="19"
              y2="4"
              stroke={item.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={item.dashed ? "4 4" : undefined}
            />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
