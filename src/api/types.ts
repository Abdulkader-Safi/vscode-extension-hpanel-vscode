// Manual types for Hostinger Public API entities.
// PRD §9 endpoint catalog drives the shape of these types.
// Refined against real account responses (Apr 2026).

export type VpsState =
  | "running"
  | "stopped"
  | "starting"
  | "stopping"
  | "unknown";

export type VpsActionsLock = "locked" | "unlocked";

export interface VpsIpAddress {
  id: number;
  address: string;
  ptr: string | null;
}

export interface VpsTemplate {
  id: number;
  name: string;
  description?: string;
  documentation?: string | null;
}

export interface Vps {
  id: number;
  firewall_group_id?: number | null;
  subscription_id?: string;
  data_center_id?: number;
  plan?: string;
  hostname: string;
  state: VpsState;
  actions_lock?: VpsActionsLock;
  cpus?: number;
  memory?: number; // MB
  disk?: number; // MB
  bandwidth?: number;
  ns1?: string;
  ns2?: string;
  ipv4?: VpsIpAddress[];
  ipv6?: VpsIpAddress[];
  template?: VpsTemplate;
  created_at?: string;
}

/**
 * One time-series of metric samples returned by `/metrics`.
 * `usage` is keyed by Unix epoch seconds (as a string) → value.
 * `unit` describes what the value means: "%" for CPU, "bytes" for RAM/disk, etc.
 */
export interface VpsMetricSeries {
  unit: string;
  usage: Record<string, number>;
}

/**
 * Top-level metrics response. Hostinger returns one series per resource;
 * exact key set may include additional series, hence the index signature.
 */
export interface VpsMetrics {
  cpu_usage?: VpsMetricSeries;
  ram_usage?: VpsMetricSeries;
  disk_usage?: VpsMetricSeries;
  network_in_usage?: VpsMetricSeries;
  network_out_usage?: VpsMetricSeries;
  [key: string]: VpsMetricSeries | undefined;
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
