import * as assert from "assert";
import { hostnameMatches } from "../hostnameMatch";

suite("hostnameMatches (Restore Backup type-to-confirm)", () => {
  test("exact match enables the restore button", () => {
    assert.strictEqual(hostnameMatches("srv-prod-01", "srv-prod-01"), true);
    assert.strictEqual(hostnameMatches("example.com", "example.com"), true);
  });

  test("any typo keeps the button disabled", () => {
    assert.strictEqual(hostnameMatches("srv-prod-01", "srv-prod-02"), false);
    assert.strictEqual(hostnameMatches("srv-prod-01", "srv-prod-01 "), false);
    assert.strictEqual(hostnameMatches("srv-prod-01", " srv-prod-01"), false);
    assert.strictEqual(hostnameMatches("srv-prod-01", "srv-prod-0"), false);
  });

  test("is case-sensitive — uppercase variants do not match", () => {
    assert.strictEqual(hostnameMatches("Server-A", "server-a"), false);
    assert.strictEqual(hostnameMatches("server-a", "Server-A"), false);
    assert.strictEqual(hostnameMatches("Server-A", "SERVER-A"), false);
  });

  test("empty hostname is never a match, even with empty input", () => {
    // Guards against the degenerate "both empty" case accidentally allowing
    // a destructive action to proceed.
    assert.strictEqual(hostnameMatches("", ""), false);
    assert.strictEqual(hostnameMatches("", "anything"), false);
  });

  test("empty typed input against a real hostname is not a match", () => {
    assert.strictEqual(hostnameMatches("srv-prod-01", ""), false);
  });

  test("handles paste of the exact hostname", () => {
    // Equivalent to a clipboard paste — still exact string equality.
    const h = "vps-2044.internal.example.com";
    assert.strictEqual(hostnameMatches(h, h), true);
  });

  test("rejects non-string inputs", () => {
    assert.strictEqual(hostnameMatches("x", null as unknown as string), false);
    assert.strictEqual(
      hostnameMatches(undefined as unknown as string, "x"),
      false,
    );
  });
});
