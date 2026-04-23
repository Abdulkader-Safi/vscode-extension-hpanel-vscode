import type { VpsMetricSeries } from "../../api/types";

/** Sort the series keys numerically and return the value at the latest one. */
export function latestValue(
  series: VpsMetricSeries | undefined
): number | undefined {
  if (!series) {
    return undefined;
  }
  const keys = Object.keys(series.usage);
  if (keys.length === 0) {
    return undefined;
  }
  let latestTs = -Infinity;
  let latestVal: number | undefined;
  for (const k of keys) {
    const ts = Number(k);
    if (Number.isFinite(ts) && ts > latestTs) {
      latestTs = ts;
      latestVal = series.usage[k];
    }
  }
  return latestVal;
}

/** Time-ordered sequence of values for sparklines. */
export function timeSeriesValues(
  series: VpsMetricSeries | undefined
): number[] {
  if (!series) {
    return [];
  }
  return Object.entries(series.usage)
    .map(([k, v]) => [Number(k), v] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

/** MB → bytes (the unit returned in `Vps.memory` and `Vps.disk`). */
export function mbToBytes(mb: number | undefined): number | undefined {
  if (mb === undefined) {
    return undefined;
  }
  return mb * 1024 * 1024;
}

/** Format a byte count as a human-readable string. */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes)) {
    return "—";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

/** Format a bytes-per-second rate. */
export function formatBytesPerSecond(bps: number | undefined): string {
  if (bps === undefined) {
    return "—";
  }
  return `${formatBytes(bps)}/s`;
}

/** Convert a value to a percentage of total, clamped to [0, 100]. */
export function pctOf(
  value: number | undefined,
  total: number | undefined
): number | undefined {
  if (value === undefined || total === undefined || total === 0) {
    return undefined;
  }
  return Math.min(100, Math.max(0, (value / total) * 100));
}
