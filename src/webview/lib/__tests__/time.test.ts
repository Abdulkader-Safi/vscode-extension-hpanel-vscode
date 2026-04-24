import * as assert from "assert";
import { formatBytes, formatTimestamp, relativeTime } from "../time";

suite("time helpers", () => {
  suite("relativeTime", () => {
    // Fixed reference point so tests are deterministic regardless of when
    // the suite runs.
    const now = Date.UTC(2026, 3, 24, 12, 0, 0); // 2026-04-24T12:00:00Z

    test("returns 'just now' within 45 seconds", () => {
      const t30s = new Date(now - 30 * 1000).toISOString();
      assert.strictEqual(relativeTime(t30s, now), "just now");
    });

    test("formats minutes ago", () => {
      const t5m = new Date(now - 5 * 60 * 1000).toISOString();
      assert.ok(
        /5 minutes ago/.test(relativeTime(t5m, now)),
        "expected '5 minutes ago' phrasing",
      );
    });

    test("formats days ago", () => {
      const t3d = new Date(now - 3 * 86_400 * 1000).toISOString();
      assert.ok(
        /3 days ago/.test(relativeTime(t3d, now)),
        "expected '3 days ago' phrasing",
      );
    });

    test("handles undefined gracefully", () => {
      assert.strictEqual(relativeTime(undefined, now), "—");
    });

    test("returns the raw string for unparseable input", () => {
      assert.strictEqual(relativeTime("not-a-date", now), "not-a-date");
    });
  });

  suite("formatTimestamp", () => {
    test("produces a non-empty localized string for valid ISO", () => {
      const out = formatTimestamp("2026-04-20T08:00:00Z");
      assert.ok(out.length > 0);
      assert.notStrictEqual(out, "—");
    });

    test("returns em-dash for undefined", () => {
      assert.strictEqual(formatTimestamp(undefined), "—");
    });

    test("returns raw string for unparseable input", () => {
      assert.strictEqual(formatTimestamp("garbage"), "garbage");
    });
  });

  suite("formatBytes", () => {
    test("formats under 1 KB with 'B' unit", () => {
      assert.strictEqual(formatBytes(512), "512 B");
    });

    test("scales to KB, MB, GB", () => {
      assert.strictEqual(formatBytes(1024), "1.0 KB");
      assert.strictEqual(formatBytes(1024 * 1024), "1.0 MB");
      assert.strictEqual(formatBytes(2 * 1024 * 1024 * 1024), "2.0 GB");
    });

    test("returns em-dash for undefined", () => {
      assert.strictEqual(formatBytes(undefined), "—");
    });
  });
});
