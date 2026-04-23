/** Clamp a value into [min, max]; non-finite values return `min`. */
export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) {
    return min;
  }
  return Math.min(max, Math.max(min, n));
}

/** Clamp a threshold percentage to [1, 99] and round to integer. */
export function clampThreshold(n: number): number {
  return Math.round(clamp(n, 1, 99));
}
