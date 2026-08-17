// Unit tests for the ari <-> hectare area conversion used by the parcel form
// unit selector (areaHa stays the canonical stored unit; ari is input/display
// only).

import { describe, expect, it } from "vitest";
import { ariToHectare, hectareToAri } from "./units";

describe("ariToHectare", () => {
  it("50 ari → 0.5 ha", () => {
    expect(ariToHectare(50)).toBe(0.5);
  });

  it("100 ari → 1 ha", () => {
    expect(ariToHectare(100)).toBe(1);
  });

  it("0 ari → 0 ha", () => {
    expect(ariToHectare(0)).toBe(0);
  });
});

describe("hectareToAri", () => {
  it("1 ha → 100 ari", () => {
    expect(hectareToAri(1)).toBe(100);
  });

  it("0.5 ha → 50 ari", () => {
    expect(hectareToAri(0.5)).toBe(50);
  });
});

describe("round-trip", () => {
  it("ha -> ari -> ha returns the original value", () => {
    const original = 1.75;
    expect(ariToHectare(hectareToAri(original))).toBeCloseTo(original, 10);
  });

  it("ari -> ha -> ari returns the original value", () => {
    const original = 235;
    expect(hectareToAri(ariToHectare(original))).toBeCloseTo(original, 10);
  });
});
