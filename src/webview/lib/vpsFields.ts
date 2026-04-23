import type { Vps } from "../../api/types";

export function primaryIpv4(vps: Vps): string | undefined {
  return vps.ipv4?.[0]?.address;
}

export function primaryIpv6(vps: Vps): string | undefined {
  return vps.ipv6?.[0]?.address;
}

/** Prefer IPv4; fall back to IPv6. */
export function primaryIp(vps: Vps): string | undefined {
  return primaryIpv4(vps) ?? primaryIpv6(vps);
}

export function osName(vps: Vps): string {
  return vps.template?.name ?? "Unknown OS";
}

/** Format MB as a human-readable size (GB if >=1024). */
export function formatMemoryMb(mb: number | undefined): string {
  if (mb === undefined) {
    return "—";
  }
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(0)} GB`;
  }
  return `${mb} MB`;
}
