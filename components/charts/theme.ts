/** Chart palette: red = SliceLive slice, gray = standard network. */
export const CHART_COLORS = {
  slice: "#EE0000",
  standard: "#747676",
  standardLight: "#D8DADA",
  ink: "#000000",
  grid: "#ECECEC",
  axis: "#626464",
  surface: "#FFFFFF",
} as const

/** Categorical order for the four use cases (validated: red/black/gray steps + direct labels) */
export const CATEGORY_COLORS = [
  "#EE0000",
  "#000000",
  "#747676",
  "#B0B3B3",
] as const

export const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 }
export const AXIS_LABEL_STYLE = {
  fill: CHART_COLORS.axis,
  fontSize: 12,
  fontWeight: 500,
} as const
