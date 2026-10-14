import { cn } from "@/lib/utils"

export interface KpiCardProps {
  label: string
  value: React.ReactNode
  unit?: string
  /** Secondary line, e.g. a comparison to the standard network */
  detail?: React.ReactNode
  icon?: React.ReactNode
  /** Emphasize the value in brand red */
  accent?: boolean
  className?: string
  children?: React.ReactNode
}

export function KpiCard({
  label,
  value,
  unit,
  detail,
  icon,
  accent,
  className,
  children,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-gray-mid bg-white p-5 shadow-card",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon ? (
          <span
            className="text-muted-foreground [&_svg]:size-4"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            "tabular text-3xl font-extrabold tracking-[-0.02em]",
            accent ? "text-brand-red" : "text-ink"
          )}
        >
          {value}
        </span>
        {unit ? (
          <span className="text-sm font-semibold text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {detail ? (
        <div className="tabular mt-1.5 text-sm text-muted-foreground">
          {detail}
        </div>
      ) : null}
      {children}
    </div>
  )
}
