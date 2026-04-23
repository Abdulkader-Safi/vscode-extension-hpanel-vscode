import type { VpsMetrics, VpsMetricSeries } from "../../api/types";

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
  return timeSeriesEntries(series).map((e) => e.value);
}

/** Time-ordered sequence of timestamps (Unix epoch seconds). */
export function timeSeriesTimestamps(
  series: VpsMetricSeries | undefined
): number[] {
  return timeSeriesEntries(series).map((e) => e.ts);
}

/** Paired timestamp + value entries, sorted by ascending timestamp. */
export function timeSeriesEntries(
  series: VpsMetricSeries | undefined
): { ts: number; value: number }[] {
  if (!series) {
    return [];
  }
  return Object.entries(series.usage)
    .map(([k, v]) => ({ ts: Number(k), value: v }))
    .sort((a, b) => a.ts - b.ts);
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

/** Format a duration in seconds as "<d>d <h>h" / "<h>h <m>m" / "<m>m". */
export function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return "—";
  }
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) {
    return `${d}d ${h}h`;
  }
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
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

/**
 * Return the first metric series whose key matches one of `candidates`
 * AND has at least one sample. Used to absorb naming variants until the
 * Hostinger API field names are confirmed against real responses.
 */
export function pickSeries(
  metrics: VpsMetrics | null | undefined,
  candidates: readonly string[]
): VpsMetricSeries | undefined {
  if (!metrics) {
    return undefined;
  }
  for (const key of candidates) {
    const series = metrics[key];
    if (series && Object.keys(series.usage).length > 0) {
      return series;
    }
  }
  return undefined;
}
