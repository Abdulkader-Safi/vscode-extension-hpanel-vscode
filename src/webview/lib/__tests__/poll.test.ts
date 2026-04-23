import * as assert from "assert";
import { pollable, type PollState } from "../poll";

const delay = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

suite("pollable", () => {
  test("ticks on interval and exposes data", async () => {
    let count = 0;
    const p = pollable<number>(
      "k",
      async () => ++count,
      {
        intervalMs: 10,
        isHidden: () => false,
        onVisibilityChange: () => () => {},
      }
    );

    await delay(50);

    let last: PollState<number> | undefined;
    const unsub = p.subscribe((s) => {
      last = s;
    });
    unsub();
    p.dispose();

    assert.ok(last);
    assert.ok((last.data ?? 0) >= 1, `expected at least one tick, got data=${last.data}`);
    assert.strictEqual(last.error, null);
  });

  test("does not tick when isHidden returns true", async () => {
    let count = 0;
    const p = pollable<number>(
      "k",
      async () => ++count,
      {
        intervalMs: 5,
        isHidden: () => true,
        onVisibilityChange: () => () => {},
      }
    );

    await delay(40);
    p.dispose();

    assert.strictEqual(count, 0);
  });

  test("single in-flight per key — overlapping ticks are dropped", async () => {
    let starts = 0;
    let releaseFetch: () => void = () => {};
    const fetcher = async (): Promise<number> => {
      starts++;
      await new Promise<void>((r) => {
        releaseFetch = r;
      });
      return starts;
    };
    const p = pollable<number>("k", fetcher, {
      intervalMs: 5,
      isHidden: () => false,
      onVisibilityChange: () => () => {},
    });

    await delay(40); // multiple intervals attempted while first is still in flight

    assert.strictEqual(starts, 1, `expected 1 in-flight; got ${starts}`);

    releaseFetch();
    await delay(20);
    p.dispose();
  });

  test("refresh() triggers an immediate out-of-cycle tick", async () => {
    let count = 0;
    const p = pollable<number>(
      "k",
      async () => ++count,
      {
        intervalMs: 100_000, // long — natural tick won't fire during test
        isHidden: () => false,
        onVisibilityChange: () => () => {},
      }
    );

    await delay(20); // initial immediate tick fires
    const before = count;
    await p.refresh();
    const after = count;
    p.dispose();

    assert.strictEqual(after, before + 1);
  });

  test("dispose() stops further ticks", async () => {
    let count = 0;
    const p = pollable<number>(
      "k",
      async () => ++count,
      {
        intervalMs: 5,
        isHidden: () => false,
        onVisibilityChange: () => () => {},
      }
    );

    await delay(20);
    p.dispose();
    const stopped = count;
    await delay(30);
    assert.strictEqual(count, stopped, "no further ticks after dispose");
  });
});
