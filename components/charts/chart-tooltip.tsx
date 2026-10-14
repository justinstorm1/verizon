export interface TooltipRow {
  label: string
  value: string
  color?: string
  dashed?: boolean
  emphasis?: boolean
}

/** Tooltip body shared by every chart. Values in ink; color only on the swatch. */
export function ChartTooltip({
  title,
  rows,
}: {
  title: string
  rows: TooltipRow[]
}) {
  return (
    <div className="min-w-44 rounded-lg border border-gray-mid bg-white px-3 py-2.5 text-sm shadow-raised">
      <p className="text-xs font-semibold text-muted-foreground">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-ink">
              {r.color ? (
                <span
                  className="h-0.5 w-3 rounded-full"
                  style={{ backgroundColor: r.color }}
                  aria-hidden="true"
                />
              ) : null}
              {r.label}
            </span>
            <span
              className={`tabular text-ink ${r.emphasis ? "font-bold" : "font-semibold"}`}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
