import * as assert from "assert";
import type { SecretStorage, SecretStorageChangeEvent, Event, Disposable } from "vscode";
import { TokenStore } from "../TokenStore";

function makeFakeSecrets(): SecretStorage {
  const store = new Map<string, string>();
  const listeners = new Set<(e: SecretStorageChangeEvent) => void>();
  const onDidChange: Event<SecretStorageChangeEvent> = (
    listener,
    _thisArgs,
    _disposables
  ): Disposable => {
    listeners.add(listener);
    return { dispose: () => listeners.delete(listener) };
  };
  return {
    get: async (key: string) => store.get(key),
    store: async (key: string, value: string) => {
      store.set(key, value);
      for (const l of listeners) {
        l({ key });
      }
    },
    delete: async (key: string) => {
      store.delete(key);
      for (const l of listeners) {
        l({ key });
      }
    },
    keys: async () => Array.from(store.keys()),
    onDidChange,
  };
}

const noDelay = async (): Promise<void> => {};

suite("TokenStore", () => {
  test("set then get round-trips the token", async () => {
    const ts = new TokenStore(makeFakeSecrets());
    await ts.set("abc123");
    assert.strictEqual(await ts.get(), "abc123");
  });

  test("clear removes the token", async () => {
    const ts = new TokenStore(makeFakeSecrets());
    await ts.set("abc123");
    await ts.clear();
    assert.strictEqual(await ts.get(), undefined);
  });

  test("has() reflects presence", async () => {
    const ts = new TokenStore(makeFakeSecrets());
    assert.strictEqual(await ts.has(), false);
    await ts.set("abc");
    assert.strictEqual(await ts.has(), true);
    await ts.clear();
    assert.strictEqual(await ts.has(), false);
  });

  test("validate() success returns ok with VPS list", async () => {
    const fetchImpl = (async () =>
      new Response(
        JSON.stringify([
          { id: 1, hostname: "vps1", state: "running" },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )) as unknown as typeof fetch;
    const ts = new TokenStore(makeFakeSecrets(), {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });
    const result = await ts.validate("good-token");
    assert.strictEqual(result.ok, true);
    if (result.ok) {
      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.data[0]?.hostname, "vps1");
    }
  });

  test("validate() failure returns ok=false and never leaks the token in the error", async () => {
    const secret = "secret-token-xyz";
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof fetch;
    const ts = new TokenStore(makeFakeSecrets(), {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });
    const result = await ts.validate(secret);
    assert.strictEqual(result.ok, false);
    if (!result.ok) {
      assert.ok(
        !result.error.includes(secret),
        `validation error must never include the raw token; got: ${result.error}`
      );
    }
  });
});
