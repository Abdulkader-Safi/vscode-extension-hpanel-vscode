import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import { HostingerWebviewProvider } from "./HostingerWebviewProvider";
import { TokenStore } from "./auth/TokenStore";
import { Preferences } from "./state/Preferences";
import { HostingerClient } from "./api/HostingerClient";
import { StatusBarController } from "./statusBar";
import { scanSshKeys, type SshKeyFs } from "./auth/scanSshKeys";

export function activate(context: vscode.ExtensionContext): void {
  const tokenStore = new TokenStore(context.secrets);
  const preferences = new Preferences(context.globalState);
  const provider = new HostingerWebviewProvider(
    context.extensionUri,
    tokenStore,
    preferences,
  );
  const statusBar = new StatusBarController(tokenStore, preferences);

  // Returns a fresh client bound to the current token, or null when not connected.
  async function activeClient(): Promise<HostingerClient | null> {
    const token = await tokenStore.get();
    if (!token) {
      return null;
    }
    return new HostingerClient(token);
  }

  // FS adapter that only opens .pub files (filter happens inside scanSshKeys).
  const sshFs: SshKeyFs = {
    async listDir(dirPath) {
      const entries = await vscode.workspace.fs.readDirectory(
        vscode.Uri.file(dirPath),
      );
      return entries.map(([name]) => name);
    },
    async readTextFile(filePath) {
      const bytes = await vscode.workspace.fs.readFile(
        vscode.Uri.file(filePath),
      );
      return Buffer.from(bytes).toString("utf8");
    },
  };

  // Phase 1 + 2 message handlers.
  provider.register("hasToken", () => tokenStore.has());
  provider.register("validateToken", async ({ token }) => {
    const result = await tokenStore.validate(token);
    if (result.ok) {
      await tokenStore.set(token);
      provider.emit("tokenChanged", { hasToken: true });
    }
    return result;
  });
  provider.register("getActiveVpsId", () => preferences.get("activeVpsId"));
  provider.register("setActiveVpsId", async ({ id }) => {
    await preferences.set("activeVpsId", id);
  });
  provider.register("openExternal", async ({ url }) => {
    if (!url.startsWith("https://")) {
      throw new Error("Only https:// URLs may be opened externally.");
    }
    await vscode.env.openExternal(vscode.Uri.parse(url));
  });

  // Phase 3 — Overview tab.
  provider.register("getActiveVps", async () => {
    const client = await activeClient();
    if (!client) {
      return null;
    }
    let id = preferences.get("activeVpsId");
    if (id === null) {
      const list = await client.vps.list();
      if (list.length === 0) {
        return null;
      }
      const first = list[0]!;
      await preferences.set("activeVpsId", first.id);
      return first;
    }
    return client.vps.get(id);
  });
  provider.register("getVpsMetrics", async ({ id }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return client.vps.metrics(id, {
      dateFrom: dayAgo.toISOString(),
      dateTo: now.toISOString(),
    });
  });
  provider.register("getVpsActions", async ({ id }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.vps.actions(id);
  });
  provider.register("vpsAction", async ({ id, action }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    if (action === "restart") {
      return client.vps.restart(id);
    }
    if (action === "stop") {
      return client.vps.stop(id);
    }
    return client.vps.recovery(id);
  });
  provider.register("getAttachedKeys", async ({ id }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.publicKeys.listAttached(id);
  });
  provider.register("openTerminal", ({ command, name }) => {
    const term = vscode.window.createTerminal({
      name: name ?? "Hostinger VPS",
    });
    term.show();
    term.sendText(command, true);
  });
  provider.register("getPreferences", () => preferences.snapshot());

  // Phase 4 — Settings tab.
  provider.register("listVps", async () => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.vps.list();
  });
  provider.register("testConnection", async () => {
    const client = await activeClient();
    if (!client) {
      return { ok: false, error: "Not connected." } as const;
    }
    try {
      const list = await client.vps.list();
      return { ok: true, count: list.length } as const;
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      } as const;
    }
  });
  provider.register("getTokenMasked", async () => {
    const token = await tokenStore.get();
    if (!token) {
      return null;
    }
    const tail = token.slice(-4);
    return `••••${tail}`;
  });
  provider.register("disconnect", async () => {
    await tokenStore.clear();
    provider.emit("tokenChanged", { hasToken: false });
  });
  provider.register("resetPreferences", async () => {
    await preferences.reset();
  });
  provider.register("setPollingEnabled", async ({ value }) => {
    await preferences.set("pollingEnabled", value);
  });
  provider.register("setPollingIntervalMs", async ({ value }) => {
    await preferences.set(
      "pollingIntervalMs",
      value as 30_000 | 60_000 | 120_000 | 300_000,
    );
  });
  provider.register("setStatusBarEnabled", async ({ value }) => {
    await preferences.set("statusBarEnabled", value);
  });
  provider.register("setThresholds", async ({ value }) => {
    await preferences.set("thresholds", value);
  });
  provider.register("setNotificationsOnThreshold", async ({ value }) => {
    await preferences.set("notificationsOnThreshold", value);
  });
  provider.register("setDeployDefaults", async ({ value }) => {
    await preferences.set("deploy", value);
  });
  provider.register("listAccountKeys", async () => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.publicKeys.listAccount();
  });
  provider.register("createAccountKey", async ({ name, key }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.publicKeys.create({ name, key });
  });
  provider.register("deleteAccountKey", async ({ id }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.publicKeys.delete(id);
  });
  provider.register("scanSshKeys", () =>
    scanSshKeys(sshFs, path.join(os.homedir(), ".ssh")),
  );
  provider.register("setSnoozeStatusBar", ({ value }) => {
    statusBar.setSnoozed(value);
  });

  // Phase 5 — Docker tab.
  provider.register("listDockerProjects", async ({ vpsId }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.docker.list(vpsId);
  });
  provider.register("getDockerContainers", async ({ vpsId, name }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.docker.containers(vpsId, name);
  });
  provider.register("getDockerLogs", async ({ vpsId, name }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.docker.logs(vpsId, name);
  });
  provider.register("dockerAction", async ({ vpsId, name, action }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    if (action === "start") {
      return client.docker.start(vpsId, name);
    }
    if (action === "stop") {
      return client.docker.stop(vpsId, name);
    }
    if (action === "restart") {
      return client.docker.restart(vpsId, name);
    }
    if (action === "update") {
      return client.docker.update(vpsId, name);
    }
    return client.docker.down(vpsId, name);
  });
  provider.register("createDockerProject", async ({ vpsId, name, compose, env }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.docker.create(vpsId, { name, compose, env });
  });

  // Phase 6 — Snapshots tab.
  provider.register("getSnapshot", async ({ vpsId }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.snapshots.get(vpsId);
  });
  provider.register("createSnapshot", async ({ vpsId }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.snapshots.create(vpsId);
  });
  provider.register("restoreSnapshot", async ({ vpsId }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.snapshots.restore(vpsId);
  });
  provider.register("deleteSnapshot", async ({ vpsId }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.snapshots.delete(vpsId);
  });
  provider.register("listBackups", async ({ vpsId }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.backups.list(vpsId);
  });
  provider.register("restoreBackup", async ({ vpsId, backupId }) => {
    const client = await activeClient();
    if (!client) {
      throw new Error("Not connected to Hostinger.");
    }
    return client.backups.restore(vpsId, backupId);
  });

  context.subscriptions.push(
    provider,
    preferences,
    statusBar,
    vscode.commands.registerCommand("hostinger-vps.open", () => {
      provider.open();
    }),
    vscode.commands.registerCommand("hostinger-vps.connect", () => {
      provider.open();
      // Soft race: if this is the first open the webview hasn't mounted its
      // navigate listener yet, but the auth guard handles no-token → onboarding
      // anyway. The emit only matters when a panel is already open and the
      // user wants to re-onboard.
      provider.emit("navigate", { path: "/onboarding" });
    }),
    vscode.commands.registerCommand("hostinger-vps.disconnect", async () => {
      await tokenStore.clear();
      provider.emit("tokenChanged", { hasToken: false });
      await vscode.window.showInformationMessage(
        "Disconnected from Hostinger.",
      );
    }),
  );
}

export function deactivate(): void {}
