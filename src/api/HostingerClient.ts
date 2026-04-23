import { HostingerApiError } from "./errors";
import type {
  Backup,
  DockerContainer,
  DockerProject,
  Firewall,
  FirewallProtocol,
  FirewallRule,
  FirewallSourceType,
  PublicKey,
  Snapshot,
  Vps,
  VpsAction,
  VpsMetrics,
} from "./types";

export interface HostingerClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  retryBaseMs?: number;
  retryFactor?: number;
  retryJitter?: number;
  maxRetries?: number;
  delayImpl?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const DEFAULT_BASE_URL = "https://developers.hostinger.com";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRY_BASE_MS = 500;
const DEFAULT_RETRY_FACTOR = 2;
const DEFAULT_RETRY_JITTER = 0.25;
const DEFAULT_MAX_RETRIES = 3;

const defaultDelay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) {return undefined;}
  const seconds = Number(header);
  if (Number.isFinite(seconds)) {return seconds * 1000;}
  const dateMs = Date.parse(header);
  if (Number.isFinite(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? delta : 0;
  }
  return undefined;
}

export class HostingerClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly retryBaseMs: number;
  private readonly retryFactor: number;
  private readonly retryJitter: number;
  private readonly maxRetries: number;
  private readonly delayImpl: (ms: number) => Promise<void>;
  private readonly timeoutMs: number;

  constructor(
    private readonly token: string,
    opts: HostingerClientOptions = {},
  ) {
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.retryBaseMs = opts.retryBaseMs ?? DEFAULT_RETRY_BASE_MS;
    this.retryFactor = opts.retryFactor ?? DEFAULT_RETRY_FACTOR;
    this.retryJitter = opts.retryJitter ?? DEFAULT_RETRY_JITTER;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.delayImpl = opts.delayImpl ?? defaultDelay;
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  private computeBackoffMs(attempt: number): number {
    const base = this.retryBaseMs * Math.pow(this.retryFactor, attempt - 1);
    const jitter = base * this.retryJitter * (Math.random() * 2 - 1);
    return Math.max(0, Math.round(base + jitter));
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
    };
    let bodyText: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      bodyText = JSON.stringify(body);
    }

    let attempt = 0;
    // Retries are bounded by maxRetries; loop exits via return or throw.
    while (true) {
      attempt++;
      let response: Response;
      try {
        response = await this.fetchImpl(url, {
          method,
          headers,
          body: bodyText,
          signal: AbortSignal.timeout(this.timeoutMs),
        });
      } catch (err) {
        const isAbort = err instanceof Error && err.name === "TimeoutError";
        const apiErr = new HostingerApiError({
          message: isAbort
            ? `Request to ${path} timed out after ${this.timeoutMs}ms`
            : `Network error calling ${path}: ${err instanceof Error ? err.message : String(err)}`,
          status: 0,
          retryable: true,
        });
        if (attempt < this.maxRetries) {
          await this.delayImpl(this.computeBackoffMs(attempt));
          continue;
        }
        throw apiErr;
      }

      if (response.ok) {
        if (response.status === 204) {return undefined as T;}
        const text = await response.text();
        if (!text) {return undefined as T;}
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new HostingerApiError({
            message: `Invalid JSON response from ${path}`,
            status: response.status,
            retryable: false,
          });
        }
      }

      const errorBody = await response.text().catch(() => "");
      let parsedMessage = response.statusText || `HTTP ${response.status}`;
      let parsedCode: string | undefined;
      try {
        const parsed = JSON.parse(errorBody) as {
          message?: string;
          code?: string;
        };
        if (parsed.message) {parsedMessage = parsed.message;}
        if (parsed.code) {parsedCode = parsed.code;}
      } catch {
        // Body is non-JSON; keep statusText.
      }

      const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
      const retryable = response.status === 429 || response.status >= 500;
      const apiErr = new HostingerApiError({
        message: parsedMessage,
        status: response.status,
        code: parsedCode,
        retryable,
        retryAfterMs,
      });

      if (retryable && attempt < this.maxRetries) {
        const backoff = this.computeBackoffMs(attempt);
        const wait =
          retryAfterMs !== undefined
            ? Math.max(retryAfterMs, backoff)
            : backoff;
        await this.delayImpl(wait);
        continue;
      }

      throw apiErr;
    }
  }

  // Domain groups — flat shapes; later phases extend each.

  vps = {
    list: (): Promise<Vps[]> =>
      this.request<Vps[]>("GET", "/api/vps/v1/virtual-machines"),
    get: (id: number): Promise<Vps> =>
      this.request<Vps>("GET", `/api/vps/v1/virtual-machines/${id}`),
    metrics: (
      id: number,
      opts: { dateFrom: string; dateTo: string },
    ): Promise<VpsMetrics> =>
      this.request<VpsMetrics>(
        "GET",
        `/api/vps/v1/virtual-machines/${id}/metrics?date_from=${encodeURIComponent(opts.dateFrom)}&date_to=${encodeURIComponent(opts.dateTo)}`,
      ),
    actions: (id: number): Promise<VpsAction[]> =>
      this.request<VpsAction[]>(
        "GET",
        `/api/vps/v1/virtual-machines/${id}/actions`,
      ),
    restart: (id: number): Promise<VpsAction> =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${id}/restart`,
      ),
    stop: (id: number): Promise<VpsAction> =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${id}/stop`,
      ),
    recovery: (id: number): Promise<VpsAction> =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${id}/recovery`,
      ),
  };

  docker = {
    list: (vpsId: number): Promise<DockerProject[]> =>
      this.request<DockerProject[]>(
        "GET",
        `/api/vps/v1/virtual-machines/${vpsId}/docker`,
      ),
    get: (vpsId: number, name: string): Promise<DockerProject> =>
      this.request<DockerProject>(
        "GET",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}`,
      ),
    containers: (vpsId: number, name: string): Promise<DockerContainer[]> =>
      this.request<DockerContainer[]>(
        "GET",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}/containers`,
      ),
    logs: (vpsId: number, name: string): Promise<{ lines: string[] }> =>
      this.request<{ lines: string[] }>(
        "GET",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}/logs`,
      ),
    start: (vpsId: number, name: string) =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}/start`,
      ),
    stop: (vpsId: number, name: string) =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}/stop`,
      ),
    restart: (vpsId: number, name: string) =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}/restart`,
      ),
    update: (vpsId: number, name: string) =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}/update`,
      ),
    down: (vpsId: number, name: string) =>
      this.request<VpsAction>(
        "DELETE",
        `/api/vps/v1/virtual-machines/${vpsId}/docker/${encodeURIComponent(name)}/down`,
      ),
    create: (
      vpsId: number,
      input: { name: string; compose: string; env?: Record<string, string> },
    ) =>
      this.request<DockerProject>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/docker`,
        input,
      ),
  };

  firewall = {
    listFirewalls: (): Promise<Firewall[]> =>
      this.request<Firewall[]>("GET", "/api/vps/v1/firewall"),
    getFirewall: (id: number): Promise<Firewall & { rules: FirewallRule[] }> =>
      this.request<Firewall & { rules: FirewallRule[] }>(
        "GET",
        `/api/vps/v1/firewall/${id}`,
      ),
    createFirewall: (name: string): Promise<Firewall> =>
      this.request<Firewall>("POST", "/api/vps/v1/firewall", { name }),
    deleteFirewall: (id: number) =>
      this.request<void>("DELETE", `/api/vps/v1/firewall/${id}`),
    syncToVm: (firewallId: number, vmId: number) =>
      this.request<void>(
        "POST",
        `/api/vps/v1/firewall/${firewallId}/sync/${vmId}`,
      ),
    addRule: (
      firewallId: number,
      rule: {
        protocol: FirewallProtocol;
        port: string;
        source_type: FirewallSourceType;
        source_detail: string;
      },
    ): Promise<FirewallRule> =>
      this.request<FirewallRule>(
        "POST",
        `/api/vps/v1/firewall/${firewallId}/rules`,
        rule,
      ),
    updateRule: (
      firewallId: number,
      ruleId: number,
      rule: Partial<{
        protocol: FirewallProtocol;
        port: string;
        source_type: FirewallSourceType;
        source_detail: string;
      }>,
    ): Promise<FirewallRule> =>
      this.request<FirewallRule>(
        "PUT",
        `/api/vps/v1/firewall/${firewallId}/rules/${ruleId}`,
        rule,
      ),
    deleteRule: (firewallId: number, ruleId: number) =>
      this.request<void>(
        "DELETE",
        `/api/vps/v1/firewall/${firewallId}/rules/${ruleId}`,
      ),
  };

  snapshots = {
    get: (vpsId: number): Promise<Snapshot | null> =>
      this.request<Snapshot | null>(
        "GET",
        `/api/vps/v1/virtual-machines/${vpsId}/snapshot`,
      ),
    create: (vpsId: number) =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/snapshot`,
      ),
    restore: (vpsId: number) =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/snapshot/restore`,
      ),
    delete: (vpsId: number) =>
      this.request<void>(
        "DELETE",
        `/api/vps/v1/virtual-machines/${vpsId}/snapshot`,
      ),
  };

  backups = {
    list: (vpsId: number): Promise<Backup[]> =>
      this.request<Backup[]>(
        "GET",
        `/api/vps/v1/virtual-machines/${vpsId}/backups`,
      ),
    restore: (vpsId: number, backupId: number) =>
      this.request<VpsAction>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/backups/${backupId}/restore`,
      ),
  };

  publicKeys = {
    listAccount: (): Promise<PublicKey[]> =>
      this.request<PublicKey[]>("GET", "/api/vps/v1/public-keys"),
    listAttached: (vpsId: number): Promise<PublicKey[]> =>
      this.request<PublicKey[]>(
        "GET",
        `/api/vps/v1/virtual-machines/${vpsId}/public-keys`,
      ),
    create: (input: { name: string; key: string }): Promise<PublicKey> =>
      this.request<PublicKey>("POST", "/api/vps/v1/public-keys", input),
    delete: (id: number) =>
      this.request<void>("DELETE", `/api/vps/v1/public-keys/${id}`),
    attach: (vpsId: number, keyId: number) =>
      this.request<void>(
        "POST",
        `/api/vps/v1/virtual-machines/${vpsId}/public-keys/${keyId}`,
      ),
  };

  hosting = {
    deployStaticWebsite: (input: {
      domain: string;
      archive_base64: string;
    }): Promise<VpsAction> =>
      this.request<VpsAction>("POST", "/api/hosting/v1/deploy/static", input),
    deployJsApplication: (input: {
      domain: string;
      archive_base64: string;
    }): Promise<VpsAction> =>
      this.request<VpsAction>("POST", "/api/hosting/v1/deploy/js", input),
    listJsDeployments: (domain: string) =>
      this.request<{ deployments: VpsAction[] }>(
        "GET",
        `/api/hosting/v1/deploy/js?domain=${encodeURIComponent(domain)}`,
      ),
    importWordpressWebsite: (input: {
      domain: string;
      archive_base64: string;
      database_dump_base64: string;
    }) =>
      this.request<VpsAction>(
        "POST",
        "/api/hosting/v1/import/wordpress",
        input,
      ),
  };
}
