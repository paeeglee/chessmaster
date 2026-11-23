import { describe, expect, it } from "vitest";
import { toPercent } from "./progress";

describe("toPercent (EVAL-06)", () => {
  it.each([
    [0, 0],
    [0.4, 40],
    [0.999, 99],
    [1, 100],
    [1.2, 100],
    [-0.1, 0],
    [Number.NaN, 0],
  ])("%s → %s", (fraction, percent) => {
    expect(toPercent(fraction)).toBe(percent);
  });
});
