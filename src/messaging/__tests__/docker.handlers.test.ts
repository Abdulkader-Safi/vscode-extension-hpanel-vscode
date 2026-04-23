import * as assert from "assert";
import { HostingerClient } from "../../api/HostingerClient";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const noDelay = async (): Promise<void> => {};

// Mirrors the dockerAction handler in src/extension.ts.
async function runDockerAction(
  client: HostingerClient,
  vpsId: number,
  name: string,
  action: "start" | "stop" | "restart" | "update" | "delete"
): Promise<unknown> {
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
}

suite("Docker handlers", () => {
  test("listDockerProjects passes through to client.docker.list", async () => {
    let hit = "";
    const fetchImpl = (async (input: RequestInfo | URL) => {
      hit = String(input);
      return jsonResponse(200, [
        { name: "app1", status: "running", container_count: 2 },
        { name: "app2", status: "stopped", container_count: 0 },
      ]);
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });
    const list = await client.docker.list(42);
    assert.strictEqual(list.length, 2);
    assert.match(hit, /\/api\/vps\/v1\/virtual-machines\/42\/docker$/);
  });

  test("dockerAction routes start/stop/restart/update/delete to the right endpoint", async () => {
    const hits: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      hits.push(`${init?.method ?? "GET"} ${String(input)}`);
      return jsonResponse(200, {
        id: 1,
        type: "action",
        status: "pending",
        started_at: "2026-04-23T00:00:00Z",
      });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });

    await runDockerAction(client, 10, "web", "start");
    await runDockerAction(client, 10, "web", "stop");
    await runDockerAction(client, 10, "web", "restart");
    await runDockerAction(client, 10, "web", "update");
    await runDockerAction(client, 10, "web", "delete");

    assert.match(hits[0]!, /POST .*\/docker\/web\/start$/);
    assert.match(hits[1]!, /POST .*\/docker\/web\/stop$/);
    assert.match(hits[2]!, /POST .*\/docker\/web\/restart$/);
    assert.match(hits[3]!, /POST .*\/docker\/web\/update$/);
    assert.match(hits[4]!, /DELETE .*\/docker\/web\/down$/);
  });

  test("createDockerProject POSTs name/compose/env body", async () => {
    let capturedBody = "";
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = String(init?.body ?? "");
      return jsonResponse(200, {
        name: "newproj",
        status: "running",
        container_count: 1,
      });
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });

    await client.docker.create(7, {
      name: "newproj",
      compose: "services:\n  web:\n    image: nginx",
      env: { FOO: "bar" },
    });
    const parsed = JSON.parse(capturedBody) as {
      name: string;
      compose: string;
      env: Record<string, string>;
    };
    assert.strictEqual(parsed.name, "newproj");
    assert.match(parsed.compose, /nginx/);
    assert.strictEqual(parsed.env.FOO, "bar");
  });

  test("encodes project name in URL path", async () => {
    let hit = "";
    const fetchImpl = (async (input: RequestInfo | URL) => {
      hit = String(input);
      return jsonResponse(200, []);
    }) as unknown as typeof fetch;
    const client = new HostingerClient("token", {
      fetchImpl,
      retryBaseMs: 1,
      delayImpl: noDelay,
    });

    await client.docker.containers(5, "my-app_1");
    assert.match(hit, /\/docker\/my-app_1\/containers$/);
  });
});
