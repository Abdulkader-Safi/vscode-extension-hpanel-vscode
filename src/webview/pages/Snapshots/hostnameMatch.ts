/**
 * Type-to-confirm guard for the Restore Backup modal (PRD §3.6.2).
 *
 * The backup-restore modal is destructive — it overwrites the VPS — so the
 * user must type the hostname **exactly** to enable the Restore button.
 * Matching is case-sensitive and whitespace-sensitive; trimming or lowercasing
 * would let a careless operator continue past the confirmation they were
 * meant to pause on.
 */
export function hostnameMatches(
  hostname: string,
  typed: string,
): boolean {
  if (typeof hostname !== "string" || typeof typed !== "string") {
    return false;
  }
  if (hostname.length === 0) {
    return false;
  }
  return typed === hostname;
}
