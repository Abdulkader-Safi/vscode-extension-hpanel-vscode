import * as assert from "assert";
import { HostingerClient } from "../HostingerClient";
import { HostingerApiError } from "../errors";

function jsonResponse(
  status: number,
  body: unknown = "",
  headers: Record<string, string> = {}
): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  return new Response(text, {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const noDelay = async (): Promise<void> => {};

suite("HostingerClient", () => {
  test("returns parsed JSON on 200", async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, [{ id: 1, hostname: "h", state: "running", ip_address: "1.2.3.4" }])) as unknown as typeof fetch;
    const client = new HostingerClient("token", { fetchImpl });
    const result = await client.vps.list();
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0]?.hostname, "h");
  });

  test("retries 429 then succeeds within max attempts", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) {
        return jsonResponse(429, "");
      }
      return jsonResponse(200, []);
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });
    const result = await client.vps.list();
    assert.strictEqual(calls, 2);
    assert.deepStrictEqual(result, []);
  });

  test("throws HostingerApiError after exhausting retries on persistent 500", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse(500, { message: "boom" });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      maxRetries: 3,
      delayImpl: noDelay,
    });
    await assert.rejects(
      () => client.vps.list(),
      (err: unknown) => {
        assert.ok(err instanceof HostingerApiError);
        assert.strictEqual(err.status, 500);
        assert.strictEqual(err.retryable, true);
        return true;
      }
    );
    assert.strictEqual(calls, 3);
  });

  test("does not retry on 401 (non-retryable)", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return jsonResponse(401, { message: "Unauthorized" });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });
    await assert.rejects(() => client.vps.list(), HostingerApiError);
    assert.strictEqual(calls, 1);
  });

  test("honors Retry-After header (seconds form)", async () => {
    let calls = 0;
    let lastDelay = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) {
        return jsonResponse(429, "", { "retry-after": "2" });
      }
      return jsonResponse(200, []);
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: async (ms) => {
        lastDelay = ms;
      },
    });
    await client.vps.list();
    assert.ok(
      lastDelay >= 2000,
      `expected delay >= 2000ms (from Retry-After), got ${lastDelay}`
    );
  });

  test("204 No Content returns undefined", async () => {
    const fetchImpl = (async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    const client = new HostingerClient("token", { fetchImpl });
    const result = await client.snapshots.delete(1);
    assert.strictEqual(result, undefined);
  });
});
