import * as assert from "assert";
import * as vscode from "vscode";
import { HostingerClient } from "../../api/HostingerClient";
import { Preferences } from "../../state/Preferences";

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

// Mirrors testConnection handler: ok/error envelope from vps.list().
async function runTestConnection(
  client: HostingerClient,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const list = await client.vps.list();
    return { ok: true, count: list.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

suite("Settings host handlers", () => {
  test("testConnection returns ok + count on success", async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, [
        { id: 1, hostname: "a", state: "running" },
        { id: 2, hostname: "b", state: "stopped" },
      ])) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });
    const result = await runTestConnection(client);
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      assert.strictEqual(result.count, 2);
    }
  });

  test("testConnection returns ok=false on 401", async () => {
    const fetchImpl = (async () =>
      jsonResponse(401, {
        message: "Invalid token",
      })) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });
    const result = await runTestConnection(client);
    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /Invalid token|Unauthorized|HTTP 401/);
    }
  });

  test("setThresholds persists via Preferences snapshot", async () => {
    const prefs = new Preferences(makeFakeMemento());
    await prefs.set("thresholds", { cpu: 70, ram: 80, disk: 90 });
    const snap = prefs.snapshot();
    assert.deepStrictEqual(snap.thresholds, { cpu: 70, ram: 80, disk: 90 });
  });

  test("setDeployDefaults persists nested object", async () => {
    const prefs = new Preferences(makeFakeMemento());
    await prefs.set("deploy", {
      preSnapshot: false,
      postAction: "restartDocker",
      confirm: false,
      defaultDomain: "example.com",
    });
    const snap = prefs.snapshot();
    assert.strictEqual(snap.deploy.preSnapshot, false);
    assert.strictEqual(snap.deploy.postAction, "restartDocker");
    assert.strictEqual(snap.deploy.confirm, false);
    assert.strictEqual(snap.deploy.defaultDomain, "example.com");
  });

  test("resetPreferences clears all stored keys", async () => {
    const memento = makeFakeMemento();
    const prefs = new Preferences(memento);
    await prefs.set("activeVpsId", 5);
    await prefs.set("pollingIntervalMs", 30_000);
    await prefs.set("statusBarEnabled", false);

    await prefs.reset();

    // After reset, snapshot should equal defaults.
    const snap = prefs.snapshot();
    const defaults = Preferences.defaults();
    assert.deepStrictEqual(snap, defaults);
  });
});
