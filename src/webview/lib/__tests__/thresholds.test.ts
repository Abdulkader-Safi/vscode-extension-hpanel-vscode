import * as assert from "assert";
import { exceeds } from "../thresholds";

suite("thresholds.exceeds", () => {
  test("below threshold → false", () => {
    assert.strictEqual(exceeds(50, 80), false);
  });

  test("at threshold → true", () => {
    assert.strictEqual(exceeds(80, 80), true);
  });

  test("above threshold → true", () => {
    assert.strictEqual(exceeds(95, 80), true);
  });

  test("undefined value → false", () => {
    assert.strictEqual(exceeds(undefined, 80), false);
  });

  test("undefined threshold → false (no signal to act on)", () => {
    assert.strictEqual(exceeds(95, undefined), false);
  });

  test("both undefined → false", () => {
    assert.strictEqual(exceeds(undefined, undefined), false);
  });

  test("zero values are valid", () => {
    assert.strictEqual(exceeds(0, 0), true);
    assert.strictEqual(exceeds(0, 1), false);
  });
});
