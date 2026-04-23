import * as assert from "assert";
import { isValidDockerProjectName } from "../dockerName";

suite("isValidDockerProjectName", () => {
  test("accepts typical names", () => {
    assert.strictEqual(isValidDockerProjectName("my-app"), true);
    assert.strictEqual(isValidDockerProjectName("app_1"), true);
    assert.strictEqual(isValidDockerProjectName("WebApp123"), true);
    assert.strictEqual(isValidDockerProjectName("a"), true);
    assert.strictEqual(isValidDockerProjectName("1"), true);
  });

  test("rejects empty", () => {
    assert.strictEqual(isValidDockerProjectName(""), false);
  });

  test("rejects whitespace", () => {
    assert.strictEqual(isValidDockerProjectName("my app"), false);
    assert.strictEqual(isValidDockerProjectName(" myapp"), false);
    assert.strictEqual(isValidDockerProjectName("myapp "), false);
    assert.strictEqual(isValidDockerProjectName("\tmyapp"), false);
  });

  test("rejects forbidden characters", () => {
    assert.strictEqual(isValidDockerProjectName("my/app"), false);
    assert.strictEqual(isValidDockerProjectName("my.app"), false);
    assert.strictEqual(isValidDockerProjectName("my:app"), false);
    assert.strictEqual(isValidDockerProjectName("my@app"), false);
  });

  test("rejects leading dash or underscore", () => {
    assert.strictEqual(isValidDockerProjectName("-myapp"), false);
    assert.strictEqual(isValidDockerProjectName("_myapp"), false);
  });

  test("accepts trailing dash or underscore", () => {
    assert.strictEqual(isValidDockerProjectName("myapp-"), true);
    assert.strictEqual(isValidDockerProjectName("myapp_"), true);
  });

  test("rejects names > 63 chars", () => {
    const max = "a".repeat(63);
    assert.strictEqual(isValidDockerProjectName(max), true);
    const tooLong = "a".repeat(64);
    assert.strictEqual(isValidDockerProjectName(tooLong), false);
  });

  test("rejects non-string input", () => {
     
    assert.strictEqual(isValidDockerProjectName(null as any), false);
     
    assert.strictEqual(isValidDockerProjectName(undefined as any), false);
     
    assert.strictEqual(isValidDockerProjectName(42 as any), false);
  });
});
