/**
 * Seeded, stateless randomness. Every value is a pure function of its inputs,
 * so simulations render identically on every run and on server and client.
 */

/** 32-bit FNV-1a hash of a string */
export function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Mix integers into a well-distributed 32-bit value (based on mulberry32) */
function mix(...parts: number[]): number {
  let t = 0x9e3779b9
  for (const p of parts) {
    t = (t + Math.imul(p | 0, 0x6d2b79f5)) | 0
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    t ^= t >>> 14
  }
  return t >>> 0
}

/** Uniform value in [0, 1) determined by the given integer keys */
export function noise(...keys: number[]): number {
  return mix(...keys) / 4294967296
}

/** Standard-normal value (Box-Muller) determined by the given keys */
export function gaussian(...keys: number[]): number {
  const u = Math.max(noise(...keys, 1), 1e-9)
  const v = noise(...keys, 2)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
