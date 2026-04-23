import * as assert from "assert";
import { buildSshCommand } from "../sshCommand";

suite("buildSshCommand", () => {
  test("builds an IPv4 ssh command with default user", () => {
    assert.strictEqual(buildSshCommand("1.2.3.4"), "ssh root@1.2.3.4");
  });

  test("respects a custom user", () => {
    assert.strictEqual(
      buildSshCommand("1.2.3.4", "ubuntu"),
      "ssh ubuntu@1.2.3.4"
    );
  });

  test("wraps IPv6 addresses in brackets", () => {
    assert.strictEqual(
      buildSshCommand("2001:db8::1"),
      "ssh root@[2001:db8::1]"
    );
  });

  test("wraps shorter IPv6 forms too", () => {
    assert.strictEqual(buildSshCommand("::1"), "ssh root@[::1]");
  });

  test("does NOT wrap IPv4-mapped (still treated as IPv6 if : appears with no .)", () => {
    // sanity: dotted address never wrapped
    assert.strictEqual(buildSshCommand("192.168.1.1"), "ssh root@192.168.1.1");
  });

  test("custom user with IPv6", () => {
    assert.strictEqual(
      buildSshCommand("2001:db8::1", "deploy"),
      "ssh deploy@[2001:db8::1]"
    );
  });

  test("returns null for undefined / null / empty IP", () => {
    assert.strictEqual(buildSshCommand(undefined), null);
    assert.strictEqual(buildSshCommand(null), null);
    assert.strictEqual(buildSshCommand(""), null);
  });
});
