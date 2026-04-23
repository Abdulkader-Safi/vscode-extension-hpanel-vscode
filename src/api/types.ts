// Conservative manual types for Hostinger Public API entities.
// Fields are added as later phases need them; nothing here is speculative.
// PRD §9 endpoint catalog drives the shape of these types.

export type VpsState =
  | "running"
  | "stopped"
  | "starting"
  | "stopping"
  | "unknown";

export interface Vps {
  id: number;
  hostname: string;
  state: VpsState;
  ip_address: string;
  ipv6_address?: string;
  plan?: string;
  cpu_cores?: number;
  ram_mb?: number;
  disk_gb?: number;
  template?: string;
  created_at?: string;
}

export interface VpsMetricsSample {
  cpu_pct: number;
  ram_pct: number;
  disk_pct: number;
  network_rx_bps: number;
  network_tx_bps: number;
  sampled_at: string;
}

export interface VpsMetrics {
  current: VpsMetricsSample;
  history: VpsMetricsSample[];
}

export type VpsActionStatus = "pending" | "running" | "completed" | "failed";

export interface VpsAction {
  id: number;
  type: string;
  status: VpsActionStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
}

export type DockerProjectStatus = "running" | "stopped" | "partial" | "unknown";

export interface DockerProject {
  name: string;
  status: DockerProjectStatus;
  container_count: number;
  created_at?: string;
}

export type DockerContainerStatus =
  | "running"
  | "stopped"
  | "restarting"
  | "exited";

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: DockerContainerStatus;
  ports?: string[];
}

export interface Firewall {
  id: number;
  name: string;
  rule_count?: number;
}

export type FirewallProtocol = "TCP" | "UDP" | "ICMP";
export type FirewallSourceType = "any" | "ip" | "cidr";

export interface FirewallRule {
  id: number;
  protocol: FirewallProtocol;
  port: string;
  source_type: FirewallSourceType;
  source_detail: string;
}

export interface Snapshot {
  id: number;
  created_at: string;
  size_bytes?: number;
}

export interface Backup {
  id: number;
  created_at: string;
}

export interface PublicKey {
  id: number;
  name: string;
  fingerprint: string;
  key?: string;
}

export interface ApiResult<T> {
  data: T;
}
