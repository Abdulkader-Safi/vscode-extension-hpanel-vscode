import * as assert from "assert";
import { HostingerClient } from "../../api/HostingerClient";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const noDelay = async (): Promise<void> => {};

suite("Snapshot & backup handlers", () => {
  test("getSnapshot hits GET /snapshot and returns the snapshot", async () => {
    let hit = "";
    let method = "";
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      hit = String(input);
      method = init?.method ?? "GET";
      return jsonResponse(200, {
        id: 9,
        created_at: "2026-04-20T10:00:00Z",
        size_bytes: 4_294_967_296,
      });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });

    const snap = await client.snapshots.get(42);
    assert.strictEqual(method, "GET");
    assert.match(hit, /\/api\/vps\/v1\/virtual-machines\/42\/snapshot$/);
    assert.ok(snap && snap.id === 9);
  });

  test("createSnapshot / restoreSnapshot / deleteSnapshot hit the right endpoints", async () => {
    const hits: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      hits.push(`${init?.method ?? "GET"} ${String(input)}`);
      return jsonResponse(200, {
        id: 1,
        type: "snapshot",
        status: "pending",
        started_at: "2026-04-24T00:00:00Z",
      });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });

    await client.snapshots.create(10);
    await client.snapshots.restore(10);
    await client.snapshots.delete(10);

    assert.match(hits[0]!, /POST .*\/virtual-machines\/10\/snapshot$/);
    assert.match(hits[1]!, /POST .*\/virtual-machines\/10\/snapshot\/restore$/);
    assert.match(hits[2]!, /DELETE .*\/virtual-machines\/10\/snapshot$/);
  });

  test("listBackups hits GET /backups and returns the list", async () => {
    let hit = "";
    const fetchImpl = (async (input: RequestInfo | URL) => {
      hit = String(input);
      return jsonResponse(200, [
        { id: 101, created_at: "2026-04-18T00:00:00Z" },
        { id: 102, created_at: "2026-04-11T00:00:00Z" },
      ]);
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });

    const backups = await client.backups.list(42);
    assert.strictEqual(backups.length, 2);
    assert.match(hit, /\/virtual-machines\/42\/backups$/);
  });

  test("restoreBackup POSTs to /backups/{backupId}/restore", async () => {
    let hit = "";
    let method = "";
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      hit = String(input);
      method = init?.method ?? "GET";
      return jsonResponse(200, {
        id: 1,
        type: "restore",
        status: "pending",
        started_at: "2026-04-24T00:00:00Z",
      });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });

    await client.backups.restore(42, 101);
    assert.strictEqual(method, "POST");
    assert.match(hit, /\/virtual-machines\/42\/backups\/101\/restore$/);
  });
});
