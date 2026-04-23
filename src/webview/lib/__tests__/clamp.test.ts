import * as assert from "assert";
import { clamp, clampThreshold } from "../clamp";

suite("clamp", () => {
  test("returns value when in range", () => {
    assert.strictEqual(clamp(5, 0, 10), 5);
  });

  test("clamps below min", () => {
    assert.strictEqual(clamp(-5, 0, 10), 0);
  });

  test("clamps above max", () => {
    assert.strictEqual(clamp(15, 0, 10), 10);
  });

  test("non-finite returns min", () => {
    assert.strictEqual(clamp(Number.NaN, 1, 99), 1);
    assert.strictEqual(clamp(Infinity, 1, 99), 1);
    assert.strictEqual(clamp(-Infinity, 1, 99), 1);
  });
});

suite("clampThreshold", () => {
  test("rounds to integer", () => {
    assert.strictEqual(clampThreshold(85.7), 86);
    assert.strictEqual(clampThreshold(85.4), 85);
  });

  test("clamps to 1..99", () => {
    assert.strictEqual(clampThreshold(0), 1);
    assert.strictEqual(clampThreshold(-50), 1);
    assert.strictEqual(clampThreshold(100), 99);
    assert.strictEqual(clampThreshold(150), 99);
  });

  test("accepts boundary values", () => {
    assert.strictEqual(clampThreshold(1), 1);
    assert.strictEqual(clampThreshold(99), 99);
  });

  test("non-finite collapses to 1", () => {
    assert.strictEqual(clampThreshold(Number.NaN), 1);
  });
});
