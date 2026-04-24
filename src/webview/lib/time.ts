/**
 * Format an ISO-8601 timestamp as a localized date+time string.
 * Returns the raw string back if it can't be parsed.
 */
export function formatTimestamp(iso: string | undefined): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleString();
}

/**
 * Relative-time string ("3 days ago", "in 2 hours", "just now").
 * Pure function — pass `now` for deterministic tests.
 */
export function relativeTime(
  iso: string | undefined,
  now: number = Date.now(),
): string {
  if (!iso) {
    return "—";
  }
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) {
    return iso;
  }
  const diffSec = Math.round((t - now) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 45) {
    return "just now";
  }
  if (abs < 90) {
    return rtf.format(Math.sign(diffSec) * 1, "minute");
  }
  if (abs < 3600) {
    return rtf.format(Math.round(diffSec / 60), "minute");
  }
  if (abs < 86400) {
    return rtf.format(Math.round(diffSec / 3600), "hour");
  }
  if (abs < 86400 * 30) {
    return rtf.format(Math.round(diffSec / 86400), "day");
  }
  if (abs < 86400 * 365) {
    return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  }
  return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
}

/**
 * Human-readable byte size. Accepts bytes or undefined.
 */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes)) {
    return "—";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
