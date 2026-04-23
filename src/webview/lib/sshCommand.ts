/**
 * Build an `ssh user@host` command from a VPS IP address.
 * IPv6 addresses are wrapped in `[]` per RFC 6874.
 * Returns null when the IP is missing — caller should hide the SSH UI.
 */
export function buildSshCommand(
  ip: string | null | undefined,
  user = "root"
): string | null {
  if (!ip) {
    return null;
  }
  const isIpv6 = ip.includes(":") && !ip.includes(".");
  const host = isIpv6 ? `[${ip}]` : ip;
  return `ssh ${user}@${host}`;
}
