import * as vscode from "vscode";
import type { TokenStore } from "./auth/TokenStore";
import type { Preferences } from "./state/Preferences";
import type {
  EventPayload,
  EventType,
  HostMessage,
  RequestPayload,
  RequestType,
  ResponsePayload,
  WebviewMessage,
} from "./messaging/contract";

type Handler<T extends RequestType> = (
  payload: RequestPayload<T>
) => Promise<ResponsePayload<T>> | ResponsePayload<T>;

export class HostingerWebviewProvider implements vscode.Disposable {
  private panel: vscode.WebviewPanel | null = null;
  private disposables: vscode.Disposable[] = [];
  private handlers = new Map<RequestType, (payload: unknown) => Promise<unknown>>();

  constructor(
    private readonly extensionUri: vscode.Uri,
    // Stored on the instance so handlers can reach them via `this`.
     
    private readonly _tokenStore: TokenStore,
    private readonly preferences: Preferences
  ) {
    this.disposables.push(
      this.preferences.onDidChange((key) => {
        this.emit("preferenceChanged", { key });
      })
    );
  }

  register<T extends RequestType>(type: T, handler: Handler<T>): void {
    this.handlers.set(type, async (payload) =>
      handler(payload as RequestPayload<T>)
    );
  }

  open(): void {
    const column =
      vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (this.panel) {
      this.panel.reveal(column);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "hostinger-vps.panel",
      "Hostinger VPS Manager",
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist")],
        retainContextWhenHidden: true,
      }
    );

    this.panel.webview.html = this.getHtml(this.panel.webview);

    const panelDisposables: vscode.Disposable[] = [];
    panelDisposables.push(
      this.panel.onDidDispose(() => {
        this.panel = null;
        for (const d of panelDisposables) {d.dispose();}
      })
    );
    panelDisposables.push(
      this.panel.webview.onDidReceiveMessage((raw) => {
        void this.routeMessage(raw);
      })
    );
  }

  emit<E extends EventType>(type: E, payload: EventPayload<E>): void {
    if (!this.panel) {return;}
    const message: HostMessage = { kind: "event", type, payload };
    void this.panel.webview.postMessage(message);
  }

  private async routeMessage(raw: unknown): Promise<void> {
    const msg = raw as WebviewMessage;
    if (!msg || typeof msg !== "object" || !msg.id || !msg.type) {return;}

    const handler = this.handlers.get(msg.type);
    if (!handler) {
      const err: HostMessage = {
        id: msg.id,
        kind: "error",
        type: msg.type,
        payload: {
          message: `No handler registered for '${msg.type}'`,
          code: "NO_HANDLER",
        },
      };
      await this.panel?.webview.postMessage(err);
      return;
    }

    try {
      const result = await handler(msg.payload);
      const response: HostMessage = {
        id: msg.id,
        kind: "response",
        type: msg.type,
        payload: result,
      };
      await this.panel?.webview.postMessage(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const errMsg: HostMessage = {
        id: msg.id,
        kind: "error",
        type: msg.type,
        payload: { message },
      };
      await this.panel?.webview.postMessage(errMsg);
    }
  }

  dispose(): void {
    this.panel?.dispose();
    this.panel = null;
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) {d.dispose();}
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "dist", "webview.css")
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource}; img-src ${webview.cspSource} data:;">
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link href="${styleUri}" rel="stylesheet">
					<title>Hostinger VPS Manager</title>
				</head>
				<body>
					<div id="root"></div>
					<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
				</body>
				</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
