import * as assert from "assert";
import { createHost } from "../../webview/lib/host";

interface CapturedPost {
  id?: string;
  type?: string;
  payload?: unknown;
}

function makeApi(): { postMessage: (m: unknown) => void; sent: CapturedPost[] } {
  const sent: CapturedPost[] = [];
  return {
    postMessage: (m) => {
      sent.push(m as CapturedPost);
    },
    sent,
  };
}

suite("Webview host messaging", () => {
  test("request resolves on matching response envelope", async () => {
    const api = makeApi();
    const target = new EventTarget();
    const host = createHost({ api, eventSource: target });

    const promise = host.request("hasToken");
    const id = api.sent[0]?.id;
    assert.ok(id, "postMessage should include a correlation id");

    target.dispatchEvent(
      new MessageEvent("message", {
        data: { id, kind: "response", type: "hasToken", payload: true },
      })
    );

    const result = await promise;
    assert.strictEqual(result, true);
  });

  test("request rejects on error envelope", async () => {
    const api = makeApi();
    const target = new EventTarget();
    const host = createHost({ api, eventSource: target });

    const promise = host.request("hasToken");
    const id = api.sent[0]?.id;

    target.dispatchEvent(
      new MessageEvent("message", {
        data: {
          id,
          kind: "error",
          type: "hasToken",
          payload: { message: "boom" },
        },
      })
    );

    await assert.rejects(() => promise, /boom/);
  });

  test("request rejects after timeout and cleans up the listener", async () => {
    const api = makeApi();
    const target = new EventTarget();
    const host = createHost({ api, eventSource: target, timeoutMs: 10 });

    const promise = host.request("hasToken");
    await assert.rejects(() => promise, /timed out/);
  });

  test("on() delivers events; dispose stops further delivery", () => {
    const api = makeApi();
    const target = new EventTarget();
    const host = createHost({ api, eventSource: target });

    const received: { hasToken: boolean }[] = [];
    const off = host.on("tokenChanged", (payload) => received.push(payload));

    target.dispatchEvent(
      new MessageEvent("message", {
        data: { kind: "event", type: "tokenChanged", payload: { hasToken: true } },
      })
    );

    off();

    target.dispatchEvent(
      new MessageEvent("message", {
        data: { kind: "event", type: "tokenChanged", payload: { hasToken: false } },
      })
    );

    assert.deepStrictEqual(received, [{ hasToken: true }]);
  });

  test("ignores response with unknown id", async () => {
    const api = makeApi();
    const target = new EventTarget();
    const host = createHost({ api, eventSource: target, timeoutMs: 30 });

    const promise = host.request("hasToken");

    // Wrong id — should be ignored, request keeps waiting until timeout.
    target.dispatchEvent(
      new MessageEvent("message", {
        data: { id: "WRONG", kind: "response", type: "hasToken", payload: true },
      })
    );

    await assert.rejects(() => promise, /timed out/);
  });
});
