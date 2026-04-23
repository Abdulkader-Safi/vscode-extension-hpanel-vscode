import * as assert from "assert";
import * as vscode from "vscode";
import { HostingerClient } from "../../api/HostingerClient";
import { Preferences } from "../../state/Preferences";
import type { Vps, VpsAction } from "../../api/types";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function makeFakeMemento(): vscode.Memento {
  const store = new Map<string, unknown>();
  return {
    get<T>(key: string, defaultValue?: T): T | undefined {
      return store.has(key) ? (store.get(key) as T) : defaultValue;
    },
    update(key: string, value: unknown): Thenable<void> {
      if (value === undefined) {
        store.delete(key);
      } else {
        store.set(key, value);
      }
      return Promise.resolve();
    },
    keys(): readonly string[] {
      return Array.from(store.keys());
    },
  };
}

const noDelay = async (): Promise<void> => {};

// Mirrors the getActiveVps handler in src/extension.ts:
//   1. read preferences.activeVpsId
//   2. if null: list, take first, persist its id, return first
//   3. else: client.vps.get(id)
async function runGetActiveVps(
  client: HostingerClient,
  preferences: Preferences
): Promise<Vps | null> {
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
}

// Mirrors vpsAction handler.
async function runVpsAction(
  client: HostingerClient,
  payload: { id: number; action: "restart" | "stop" | "recovery" }
): Promise<VpsAction> {
  if (payload.action === "restart") {
    return client.vps.restart(payload.id);
  }
  if (payload.action === "stop") {
    return client.vps.stop(payload.id);
  }
  return client.vps.recovery(payload.id);
}

suite("Overview host handlers", () => {
  test("getActiveVps with no active id auto-selects first VPS and persists", async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, [
        { id: 42, hostname: "auto", state: "running" },
        { id: 99, hostname: "second", state: "stopped" },
      ])) as unknown as typeof fetch;
    const client = new HostingerClient("token", { fetchImpl, retryBaseMs: 1, delayImpl: noDelay });
    const prefs = new Preferences(makeFakeMemento());

    const result = await runGetActiveVps(client, prefs);

    assert.ok(result);
    assert.strictEqual(result.id, 42);
    assert.strictEqual(prefs.get("activeVpsId"), 42, "activeVpsId should be persisted");
  });

  test("getActiveVps with empty list returns null and does NOT persist", async () => {
    const fetchImpl = (async () => jsonResponse(200, [])) as unknown as typeof fetch;
    const client = new HostingerClient("token", { fetchImpl, retryBaseMs: 1, delayImpl: noDelay });
    const prefs = new Preferences(makeFakeMemento());

    const result = await runGetActiveVps(client, prefs);

    assert.strictEqual(result, null);
    assert.strictEqual(prefs.get("activeVpsId"), null, "activeVpsId stays null");
  });

  test("getActiveVps with stored id calls vps.get and does NOT re-list", async () => {
    let listCalls = 0;
    let getCalls = 0;
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/api/vps/v1/virtual-machines")) {
        listCalls++;
        return jsonResponse(200, []);
      }
      if (/\/virtual-machines\/77$/.test(url)) {
        getCalls++;
        return jsonResponse(200, {
          id: 77,
          hostname: "stored",
          state: "running",
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    }) as unknown as typeof fetch;

    const client = new HostingerClient("token", { fetchImpl, retryBaseMs: 1, delayImpl: noDelay });
    const prefs = new Preferences(makeFakeMemento());
    await prefs.set("activeVpsId", 77);

    const result = await runGetActiveVps(client, prefs);

    assert.ok(result);
    assert.strictEqual(result.id, 77);
    assert.strictEqual(listCalls, 0, "should NOT call vps.list when activeVpsId is set");
    assert.strictEqual(getCalls, 1);
  });

  test("vpsAction restart hits the restart endpoint", async () => {
    let hit = "";
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      hit = `${init?.method ?? "GET"} ${String(input)}`;
      return jsonResponse(200, { id: 1, type: "restart", status: "pending", started_at: "2026-04-23T00:00:00Z" });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", { fetchImpl, retryBaseMs: 1, delayImpl: noDelay });

    const action = await runVpsAction(client, { id: 5, action: "restart" });

    assert.strictEqual(action.type, "restart");
    assert.match(hit, /POST .*\/virtual-machines\/5\/restart$/);
  });

  test("vpsAction recovery hits the recovery endpoint", async () => {
    let hit = "";
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      hit = `${init?.method ?? "GET"} ${String(input)}`;
      return jsonResponse(200, { id: 2, type: "recovery", status: "pending", started_at: "2026-04-23T00:00:00Z" });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", { fetchImpl, retryBaseMs: 1, delayImpl: noDelay });

    await runVpsAction(client, { id: 9, action: "recovery" });

    assert.match(hit, /POST .*\/virtual-machines\/9\/recovery$/);
  });
});
