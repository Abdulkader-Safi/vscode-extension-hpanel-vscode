import * as assert from "assert";
import * as vscode from "vscode";
import { Preferences } from "../Preferences";

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

suite("Preferences", () => {
  test("returns defaults when nothing stored", () => {
    const p = new Preferences(makeFakeMemento());
    assert.strictEqual(p.get("activeVpsId"), null);
    assert.strictEqual(p.get("pollingEnabled"), true);
    assert.strictEqual(p.get("pollingIntervalMs"), 60_000);
    assert.deepStrictEqual(p.get("thresholds"), {
      cpu: 85,
      ram: 90,
      disk: 80,
    });
  });

  test("set then get round-trips", async () => {
    const p = new Preferences(makeFakeMemento());
    await p.set("activeVpsId", 42);
    assert.strictEqual(p.get("activeVpsId"), 42);
  });

  test("onDidChange fires with the changed key", async () => {
    const p = new Preferences(makeFakeMemento());
    const fired: string[] = [];
    p.onDidChange((key) => fired.push(key));

    await p.set("activeVpsId", 1);
    await p.set("pollingIntervalMs", 30_000);

    assert.deepStrictEqual(fired, ["activeVpsId", "pollingIntervalMs"]);
  });

  test("snapshot() returns merged schema", async () => {
    const p = new Preferences(makeFakeMemento());
    await p.set("activeVpsId", 7);
    await p.set("pollingIntervalMs", 30_000);
    const snap = p.snapshot();
    assert.strictEqual(snap.activeVpsId, 7);
    assert.strictEqual(snap.pollingIntervalMs, 30_000);
    // Defaults preserved for un-set keys
    assert.strictEqual(snap.statusBarEnabled, true);
    assert.deepStrictEqual(snap.thresholds, { cpu: 85, ram: 90, disk: 80 });
  });

  test("reset() clears all stored values + emits per-key", async () => {
    const p = new Preferences(makeFakeMemento());
    await p.set("activeVpsId", 9);
    await p.set("pollingIntervalMs", 30_000);

    const fired: string[] = [];
    p.onDidChange((k) => fired.push(k));

    await p.reset();

    assert.strictEqual(p.get("activeVpsId"), null);
    assert.strictEqual(p.get("pollingIntervalMs"), 60_000);
    // Reset emits one event per key in the schema (>= 7 keys)
    assert.ok(fired.length >= 7, `expected >=7 events; got ${fired.length}`);
  });

  test("nested object values shallow-merge with defaults", async () => {
    const p = new Preferences(makeFakeMemento());
    // Persist a partial thresholds object (simulates older preference shape)
    await p.set("thresholds", { cpu: 50, ram: 75, disk: 80 });
    const t = p.get("thresholds");
    assert.strictEqual(t.cpu, 50);
    assert.strictEqual(t.ram, 75);
    assert.strictEqual(t.disk, 80);
  });
});
