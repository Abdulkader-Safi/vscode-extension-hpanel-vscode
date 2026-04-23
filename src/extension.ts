import * as vscode from "vscode";
import { HostingerWebviewProvider } from "./HostingerWebviewProvider";
import { TokenStore } from "./auth/TokenStore";
import { Preferences } from "./state/Preferences";

export function activate(context: vscode.ExtensionContext): void {
  const tokenStore = new TokenStore(context.secrets);
  const preferences = new Preferences(context.globalState);
  const provider = new HostingerWebviewProvider(
    context.extensionUri,
    tokenStore,
    preferences
  );

  // Phase 1 + 2 message handlers — extended per phase.
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

  context.subscriptions.push(
    provider,
    preferences,
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
      await vscode.window.showInformationMessage("Disconnected from Hostinger.");
    })
  );
}

export function deactivate(): void {}
