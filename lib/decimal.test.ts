// Unit tests for the Albanian-locale comma-decimal input parser shared by
// every form that takes a decimal quantity (parcel area, expense/harvest
// quantity, unit price, amount, revenue).

import { describe, expect, it } from "vitest";
import { parseLocaleDecimal } from "./decimal";

describe("parseLocaleDecimal — Albanian comma-decimal normalization", () => {
  it('converts a comma decimal: "0,12" → 0.12', () => {
    expect(parseLocaleDecimal("0,12")).toBe(0.12);
  });

  it('leaves a dot decimal unchanged: "12.5" → 12.5', () => {
    expect(parseLocaleDecimal("12.5")).toBe(12.5);
  });

  it('parses a plain integer string: "1000" → 1000', () => {
    expect(parseLocaleDecimal("1000")).toBe(1000);
  });

  it('parses a trailing comma with nothing after it: "5," → 5 (JS allows a trailing dot)', () => {
    expect(parseLocaleDecimal("5,")).toBe(5);
  });

  it("only replaces the FIRST comma — a second comma leaves the result malformed (NaN)", () => {
    // "12,5,6" → "12.5,6" → Number(...) is NaN. This documents a real
    // limitation of the current one-comma-only implementation.
    expect(Number.isNaN(parseLocaleDecimal("12,5,6"))).toBe(true);
  });

  it("returns NaN for non-numeric input, never silently 0", () => {
    expect(Number.isNaN(parseLocaleDecimal("abc"))).toBe(true);
  });
});
