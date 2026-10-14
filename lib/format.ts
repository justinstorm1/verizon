const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
})
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 })

export const formatUSD = (n: number) => usd0.format(n)
export const formatUSDCents = (n: number) => usd2.format(n)
export const formatUSDCompact = (n: number) => usdCompact.format(n)
export const formatInt = (n: number) => int.format(n)
export const formatPct = (share: number, digits = 0) =>
  `${(share * 100).toFixed(digits)}%`
export const formatMs = (n: number) => `${Math.round(n)} ms`
export const formatMbps = (n: number) => `${Math.round(n)} Mbps`
export const formatMultiplier = (n: number) => `×${n.toFixed(2)}`

export function formatDateLong(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map(Number)
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)))
}
