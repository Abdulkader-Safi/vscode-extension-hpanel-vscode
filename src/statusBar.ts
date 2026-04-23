import * as vscode from "vscode";
import { HostingerClient } from "./api/HostingerClient";
import type { TokenStore } from "./auth/TokenStore";
import type { Preferences } from "./state/Preferences";
import { latestValue, pickSeries } from "./webview/lib/metrics";

const DISK_KEYS = [
  "disk_space",
  "disk_usage",
  "disk_space_usage",
  "storage_usage",
] as const;

export interface StatusBarOptions {
  /** Optional factory used by tests to inject a mocked HostingerClient. */
  clientFactory?: (token: string) => HostingerClient;
}

export class StatusBarController implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private snoozed = false;

  constructor(
    private readonly tokenStore: TokenStore,
    private readonly preferences: Preferences,
    private readonly opts: StatusBarOptions = {},
  ) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100,
    );
    this.item.command = "hostinger-vps.open";
    this.disposables.push(this.item);

    this.disposables.push(
      this.preferences.onDidChange((key) => {
        if (key === "statusBarEnabled") {
          this.applyVisibility();
        } else if (
          key === "activeVpsId" ||
          key === "pollingIntervalMs" ||
          key === "pollingEnabled" ||
          key === "thresholds"
        ) {
          this.restartPoll();
        }
      }),
    );

    this.applyVisibility();
  }

  setSnoozed(snoozed: boolean): void {
    this.snoozed = snoozed;
    void this.tick();
  }

  private buildClient(token: string): HostingerClient {
    return this.opts.clientFactory?.(token) ?? new HostingerClient(token);
  }

  private applyVisibility(): void {
    if (this.preferences.get("statusBarEnabled")) {
      this.item.show();
      this.restartPoll();
    } else {
      this.item.hide();
      this.stopPoll();
    }
  }

  private restartPoll(): void {
    this.stopPoll();
    if (!this.preferences.get("statusBarEnabled")) {
      return;
    }
    if (!this.preferences.get("pollingEnabled")) {
      return;
    }
    void this.tick();
    this.timer = setInterval(
      () => void this.tick(),
      this.preferences.get("pollingIntervalMs"),
    );
  }

  private stopPoll(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    try {
      const token = await this.tokenStore.get();
      if (!token) {
        this.item.text = "$(circle-outline) Not connected";
        this.item.backgroundColor = undefined;
        return;
      }
      const client = this.buildClient(token);

      let id = this.preferences.get("activeVpsId");
      if (id === null) {
        const list = await client.vps.list();
        if (list.length === 0) {
          this.item.text = "$(circle-outline) No VPS";
          this.item.backgroundColor = undefined;
          return;
        }
        id = list[0]!.id;
        await this.preferences.set("activeVpsId", id);
      }

      const vps = await client.vps.get(id);
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 86_400_000);
      const metrics = await client.vps.metrics(id, {
        dateFrom: dayAgo.toISOString(),
        dateTo: now.toISOString(),
      });

      const cpu = latestValue(metrics.cpu_usage);
      const cpuLabel = cpu === undefined ? "—%" : `${cpu.toFixed(0)}%`;
      this.item.text = `$(circle-filled) ${vps.hostname} ${cpuLabel}`;
      this.item.tooltip = `Hostinger VPS: ${vps.hostname}`;

      const t = this.preferences.get("thresholds");
      const ramBytes = latestValue(metrics.ram_usage);
      const diskBytes = latestValue(pickSeries(metrics, DISK_KEYS));
      const memTotal = vps.memory ? vps.memory * 1024 * 1024 : undefined;
      const diskTotal = vps.disk ? vps.disk * 1024 * 1024 : undefined;
      const ramPct =
        ramBytes !== undefined && memTotal
          ? (ramBytes / memTotal) * 100
          : undefined;
      const diskPct =
        diskBytes !== undefined && diskTotal
          ? (diskBytes / diskTotal) * 100
          : undefined;

      const tripped =
        (cpu !== undefined && cpu >= t.cpu) ||
        (ramPct !== undefined && ramPct >= t.ram) ||
        (diskPct !== undefined && diskPct >= t.disk);

      this.item.backgroundColor =
        tripped && !this.snoozed
          ? new vscode.ThemeColor("statusBarItem.warningBackground")
          : undefined;
    } catch {
      this.item.text = "$(circle-outline) Error";
      this.item.backgroundColor = undefined;
    }
  }

  dispose(): void {
    this.stopPoll();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}
