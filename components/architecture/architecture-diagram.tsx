import {
  Activity,
  ArrowDown,
  CalendarClock,
  Cpu,
  Gauge,
  RadioTower,
  Smartphone,
} from "lucide-react"

import { cn } from "@/lib/utils"

export interface ArchNode {
  title: string
  caption: string
  icon: typeof Smartphone
  simulated?: boolean
}

export const ARCH_NODES: ArchNode[] = [
  {
    title: "Customer storefront",
    caption:
      "Self-serve web storefront: browse packages, pick a venue and time, and book.",
    icon: Smartphone,
  },
  {
    title: "Eligibility and capacity engine",
    caption:
      "Checks standalone 5G coverage and device compatibility, and blocks any booking that would oversell a site.",
    icon: Gauge,
  },
  {
    title: "Pricing and scheduling",
    caption:
      "Applies peak, off-peak, weekend, and scarcity multipliers, and holds the booking calendar.",
    icon: CalendarClock,
  },
  {
    title: "Slice provisioning",
    caption:
      "Simulated; would integrate with the operator's orchestration systems.",
    icon: Cpu,
    simulated: true,
  },
  {
    title: "5G standalone core and edge",
    caption:
      "The standalone core and RAN enforce the slice, with user-plane processing at the edge near the venue.",
    icon: RadioTower,
  },
  {
    title: "Monitoring and SLA dashboard",
    caption:
      "Shows aggregate latency, throughput, and loss per slice, and flags any missed guarantee.",
    icon: Activity,
  },
]

/** Greedy word wrap for SVG text (SVG has no automatic wrapping) */
function wrapWords(text: string, maxChars: number) {
  const lines: string[] = []
  for (const word of text.split(" ")) {
    const last = lines[lines.length - 1]
    if (last && `${last} ${word}`.length <= maxChars) {
      lines[lines.length - 1] = `${last} ${word}`
    } else {
      lines.push(word)
    }
  }
  return lines
}

// Desktop diagram geometry (SVG user units; scales with container width)
const W = 1200
const BOX_W = 168
const GAP = (W - BOX_W * ARCH_NODES.length) / (ARCH_NODES.length - 1)
const BOX_Y = 70
const BOX_H = 120
const x = (i: number) => i * (BOX_W + GAP)

/** Horizontal flow diagram for large screens. Captions render in HTML below, aligned to boxes. */
function DesktopDiagram() {
  const feedbackFrom = x(5) + BOX_W / 2
  const feedbackTo = x(1) + BOX_W / 2
  return (
    <div className="hidden lg:block" aria-hidden="true">
      <svg
        viewBox={`0 0 ${W} ${BOX_Y + BOX_H + 6}`}
        className="w-full overflow-visible"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#000" />
          </marker>
          <marker
            id="arrow-gray"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#747676" />
          </marker>
        </defs>

        {/* Feedback loop: monitoring informs pricing and capacity */}
        <path
          d={`M${feedbackFrom},${BOX_Y - 4} C${feedbackFrom},${BOX_Y - 56} ${feedbackTo},${BOX_Y - 56} ${feedbackTo},${BOX_Y - 4}`}
          fill="none"
          stroke="#747676"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          markerEnd="url(#arrow-gray)"
        />
        <rect
          x={(feedbackFrom + feedbackTo) / 2 - 150}
          y={BOX_Y - 56}
          width="300"
          height="22"
          fill="#fff"
        />
        <text
          x={(feedbackFrom + feedbackTo) / 2}
          y={BOX_Y - 41}
          textAnchor="middle"
          fontSize="13"
          fill="#626464"
          fontWeight="500"
        >
          Live usage data tunes prices and capacity
        </text>

        {ARCH_NODES.map((n, i) => {
          const bx = x(i)
          const lines = wrapWords(n.title, 15)
          return (
            <g key={n.title}>
              <rect
                x={bx}
                y={BOX_Y}
                width={BOX_W}
                height={BOX_H}
                rx="8"
                fill={n.simulated ? "#F6F6F6" : "#fff"}
                stroke={n.simulated ? "#747676" : "#000"}
                strokeWidth={n.simulated ? 1.5 : 1.5}
                strokeDasharray={n.simulated ? "6 4" : undefined}
              />
              <circle
                cx={bx + 22}
                cy={BOX_Y + 24}
                r="11"
                fill={i === 0 || i === 5 ? "#EE0000" : "#000"}
              />
              <text
                x={bx + 22}
                y={BOX_Y + 28.5}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#fff"
              >
                {i + 1}
              </text>
              {n.simulated ? (
                <g>
                  <rect
                    x={bx + BOX_W - 82}
                    y={BOX_Y + 14}
                    width="70"
                    height="20"
                    rx="10"
                    fill="#fff"
                    stroke="#747676"
                  />
                  <text
                    x={bx + BOX_W - 47}
                    y={BOX_Y + 28}
                    textAnchor="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="#626464"
                    letterSpacing="0.5"
                  >
                    SIMULATED
                  </text>
                </g>
              ) : null}
              {lines.map((line, li) => (
                <text
                  key={li}
                  x={bx + 14}
                  y={BOX_Y + 66 + li * 19 - (lines.length - 1) * 6}
                  fontSize="15"
                  fontWeight="700"
                  fill="#000"
                >
                  {line}
                </text>
              ))}
              {i < ARCH_NODES.length - 1 ? (
                <line
                  x1={bx + BOX_W + 4}
                  y1={BOX_Y + BOX_H / 2}
                  x2={bx + BOX_W + GAP - 5}
                  y2={BOX_Y + BOX_H / 2}
                  stroke="#000"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              ) : null}
            </g>
          )
        })}
      </svg>
      <ol
        className="mt-4 grid"
        style={{
          gridTemplateColumns: `repeat(${ARCH_NODES.length}, minmax(0, 1fr))`,
          columnGap: `${(GAP / W) * 100}%`,
        }}
      >
        {ARCH_NODES.map((n) => (
          <li
            key={n.title}
            className="text-sm leading-snug text-muted-foreground"
          >
            {n.caption}
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Vertical flow for small screens; also the accessible version on every screen. */
function ListDiagram() {
  return (
    <ol
      className="space-y-0 lg:sr-only"
      aria-label="SliceLive architecture, in request order"
    >
      {ARCH_NODES.map((n, i) => (
        <li key={n.title}>
          <div
            className={cn(
              "flex gap-4 rounded-lg border-[1.5px] bg-white p-4",
              n.simulated
                ? "border-dashed border-gray-dark bg-gray-light"
                : "border-ink"
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                i === 0 || i === ARCH_NODES.length - 1
                  ? "bg-brand-red"
                  : "bg-ink"
              )}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <div>
              <p className="flex flex-wrap items-center gap-2 font-bold text-ink">
                {n.title}
                {n.simulated ? (
                  <span className="rounded-full border border-gray-dark px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                    Simulated
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{n.caption}</p>
            </div>
          </div>
          {i < ARCH_NODES.length - 1 ? (
            <div className="flex justify-center py-1.5" aria-hidden="true">
              <ArrowDown className="size-5 text-ink" />
            </div>
          ) : (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Monitoring data flows back to the eligibility and capacity engine.
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}

export function ArchitectureDiagram() {
  return (
    <figure className="m-0">
      <DesktopDiagram />
      <ListDiagram />
    </figure>
  )
}
