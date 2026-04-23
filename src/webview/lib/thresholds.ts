export type MetricKind = "cpu" | "ram" | "disk";

/**
 * True when `value` meets or exceeds `threshold`. Either being undefined
 * yields false (no signal to act on).
 */
export function exceeds(
  value: number | undefined,
  threshold: number | undefined
): boolean {
  if (value === undefined || threshold === undefined) {
    return false;
  }
  return value >= threshold;
}
