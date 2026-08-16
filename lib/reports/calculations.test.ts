// Unit tests for the report formulas (cost/unit, yield, margin, totals) that
// back app/api/reports/route.ts. These are the core calculations of the
// thesis — this file is written to double as a readable test report:
// each `it(...)` title states the rule being checked in plain language.
//
// These tests verify the EXISTING formulas as implemented. If a case here
// looks surprising, that is a note-worthy finding to report, not something
// to "fix" by changing the assertion to match — see the "known discrepancy"
// section at the bottom of this file.

import { describe, expect, it } from "vitest";
import {
  computeCostPerUnit,
  computeMarginPct,
  computeNetProfit,
  computeOverallCostPerUnit,
  computeReportSummary,
  computeSeasonCalculation,
  computeYieldPerHa,
  groupQuantityByUnit,
  singleUnitQuantity,
  sumTotalCost,
  sumTotalRevenue,
} from "./calculations";

describe("sumTotalCost — Shpenzime totale = SUM(expense.amount)", () => {
  it("sums multiple expense amounts", () => {
    expect(sumTotalCost([300, 400, 300])).toBe(1000);
  });

  it("returns 0 for no expenses (honest zero, not missing)", () => {
    expect(sumTotalCost([])).toBe(0);
  });

  it("keeps full decimal precision, no rounding", () => {
    expect(sumTotalCost([10.1, 20.25, 5.001])).toBeCloseTo(35.351, 10);
  });
});

describe("sumTotalRevenue — Të ardhura = SUM(harvest.revenue)", () => {
  it("sums multiple harvest revenues", () => {
    expect(sumTotalRevenue([{ revenue: 1000 }, { revenue: 1000 }])).toBe(2000);
  });

  it("treats a null revenue as 0, not as missing/excluded", () => {
    expect(
      sumTotalRevenue([{ revenue: 500 }, { revenue: null }, { revenue: 300 }])
    ).toBe(800);
  });

  it("returns 0 when every harvest has null revenue", () => {
    expect(sumTotalRevenue([{ revenue: null }, { revenue: null }])).toBe(0);
  });

  it("returns 0 for no harvests", () => {
    expect(sumTotalRevenue([])).toBe(0);
  });
});

describe("groupQuantityByUnit — never sums across different units", () => {
  it("sums multiple harvests that share one unit", () => {
    const result = groupQuantityByUnit([
      { unit: "ton", quantity: 2 },
      { unit: "ton", quantity: 3 },
    ]);
    expect(result).toEqual([{ unit: "ton", quantity: 5 }]);
  });

  it("keeps different units as SEPARATE groups instead of summing them", () => {
    const result = groupQuantityByUnit([
      { unit: "kg", quantity: 10 },
      { unit: "ton", quantity: 2 },
    ]);
    expect(result).toEqual([
      { unit: "kg", quantity: 10 },
      { unit: "ton", quantity: 2 },
    ]);
  });

  it("preserves the order units first appear in", () => {
    const result = groupQuantityByUnit([
      { unit: "sack", quantity: 1 },
      { unit: "kg", quantity: 5 },
      { unit: "sack", quantity: 2 },
    ]);
    expect(result.map((r) => r.unit)).toEqual(["sack", "kg"]);
  });

  it("returns an empty list for no harvests", () => {
    expect(groupQuantityByUnit([])).toEqual([]);
  });
});

describe("singleUnitQuantity — a coherent quantity only exists for exactly one unit", () => {
  it("returns the quantity when there is exactly one unit", () => {
    expect(singleUnitQuantity([{ unit: "ton", quantity: 5 }])).toEqual({
      unit: "ton",
      quantity: 5,
    });
  });

  it("returns null for zero units (no harvests at all)", () => {
    expect(singleUnitQuantity([])).toBeNull();
  });

  it("returns null for mixed units (ambiguous — cannot pick one)", () => {
    expect(
      singleUnitQuantity([
        { unit: "kg", quantity: 10 },
        { unit: "ton", quantity: 2 },
      ])
    ).toBeNull();
  });
});

describe("computeNetProfit — Fitimi neto = Të ardhura − Shpenzime totale", () => {
  it("is positive when revenue exceeds cost", () => {
    expect(computeNetProfit(2000, 1000)).toBe(1000);
  });

  it("is NEGATIVE when cost exceeds revenue (loss case)", () => {
    expect(computeNetProfit(500, 900)).toBe(-400);
  });

  it("is 0 when revenue equals cost exactly (break-even)", () => {
    expect(computeNetProfit(750, 750)).toBe(0);
  });
});

describe("computeMarginPct — (Fitimi neto / Të ardhura) × 100", () => {
  it("computes the known clean example: (2000-1000)/2000*100 = 50%", () => {
    expect(computeMarginPct(1000, 2000)).toBe(50);
  });

  it("is null (never Infinity/NaN) when revenue is 0", () => {
    const result = computeMarginPct(0, 0);
    expect(result).toBeNull();
    expect(result).not.toBe(Infinity);
    expect(Number.isNaN(result as number)).toBe(false);
  });

  it("is negative for a loss (cost > revenue)", () => {
    expect(computeMarginPct(-400, 500)).toBe(-80);
  });

  it("keeps full precision, not pre-rounded to 2 decimals", () => {
    // 1/3 * 100 = 33.333...% — must NOT be truncated to 33.33 at this layer;
    // rounding is a display-time concern only.
    const result = computeMarginPct(100, 300)!;
    expect(result).toBeCloseTo(33.3333333333, 8);
    expect(result.toFixed(10)).not.toBe(result.toFixed(2));
  });
});

describe("computeCostPerUnit — Shpenzime totale / Sasia e korrur", () => {
  it("computes the known clean example: 1000 / 5 = 200", () => {
    expect(computeCostPerUnit(1000, { unit: "ton", quantity: 5 })).toBe(200);
  });

  it("is null (not Infinity) when the harvested quantity is 0", () => {
    const result = computeCostPerUnit(1000, { unit: "ton", quantity: 0 });
    expect(result).toBeNull();
    expect(result).not.toBe(Infinity);
  });

  it("is null when there is no single coherent unit (e.g. mixed units)", () => {
    expect(computeCostPerUnit(1000, null)).toBeNull();
  });
});

describe("computeYieldPerHa — Sasia e korrur / parcel.areaHa", () => {
  it("computes the known clean example: 5 / 2 = 2.5", () => {
    expect(computeYieldPerHa(2, { unit: "ton", quantity: 5 })).toBe(2.5);
  });

  it("is null (not Infinity) when the parcel's area is 0", () => {
    const result = computeYieldPerHa(0, { unit: "ton", quantity: 5 });
    expect(result).toBeNull();
    expect(result).not.toBe(Infinity);
  });

  it("is 0 (a real yield, NOT null) when quantity is 0 but area is > 0", () => {
    // Distinct from costPerUnit: yield only guards against a zero
    // DENOMINATOR (area). A season that harvested nothing on a real parcel
    // has a genuine yield of 0 t/ha — that is honest data, not missing data.
    expect(computeYieldPerHa(2, { unit: "ton", quantity: 0 })).toBe(0);
  });

  it("is null when there is no single coherent unit", () => {
    expect(computeYieldPerHa(2, null)).toBeNull();
  });
});

describe("computeSeasonCalculation — the full per-season formula set", () => {
  it("THE KNOWN CLEAN EXAMPLE: cost 1000, harvest 5t, revenue 2000, area 2ha", () => {
    const result = computeSeasonCalculation({
      expenseAmounts: [1000],
      harvests: [{ unit: "ton", quantity: 5, revenue: 2000 }],
      areaHa: 2,
    });
    expect(result.totalCost).toBe(1000);
    expect(result.totalRevenue).toBe(2000);
    expect(result.netProfit).toBe(1000);
    expect(result.marginPct).toBe(50);
    expect(result.costPerUnit).toBe(200);
    expect(result.costPerUnitUnit).toBe("ton");
    expect(result.yieldPerHa).toBe(2.5);
    expect(result.yieldUnit).toBe("ton");
  });

  it("sums multiple expenses and multiple harvests of the same unit", () => {
    const result = computeSeasonCalculation({
      expenseAmounts: [200, 300, 500],
      harvests: [
        { unit: "kg", quantity: 40, revenue: 600 },
        { unit: "kg", quantity: 60, revenue: 900 },
      ],
      areaHa: 4,
    });
    expect(result.totalCost).toBe(1000);
    expect(result.totalRevenue).toBe(1500);
    expect(result.harvestedQuantity).toEqual([{ unit: "kg", quantity: 100 }]);
    expect(result.costPerUnit).toBe(10);
    expect(result.yieldPerHa).toBe(25);
  });

  it("a harvest with no revenue recorded contributes 0, not an error", () => {
    const result = computeSeasonCalculation({
      expenseAmounts: [100],
      harvests: [{ unit: "kg", quantity: 10, revenue: null }],
      areaHa: 1,
    });
    expect(result.totalRevenue).toBe(0);
    expect(result.marginPct).toBeNull();
    expect(result.costPerUnit).toBe(10);
  });

  it("MIXED UNITS: costPerUnit/yieldPerHa are '—' (null), quantities stay grouped", () => {
    const result = computeSeasonCalculation({
      expenseAmounts: [1000],
      harvests: [
        { unit: "kg", quantity: 400, revenue: 800 },
        { unit: "sack", quantity: 12, revenue: 1200 },
      ],
      areaHa: 2,
    });
    expect(result.harvestedQuantity).toEqual([
      { unit: "kg", quantity: 400 },
      { unit: "sack", quantity: 12 },
    ]);
    expect(result.costPerUnit).toBeNull();
    expect(result.costPerUnitUnit).toBeNull();
    expect(result.yieldPerHa).toBeNull();
    expect(result.yieldUnit).toBeNull();
    // Revenue/margin are unaffected by the unit mix — they are pure euros.
    expect(result.totalRevenue).toBe(2000);
    expect(result.marginPct).toBe(50);
  });

  it("a season with zero harvests: quantity fields empty, revenue 0, cost still counted", () => {
    const result = computeSeasonCalculation({
      expenseAmounts: [150],
      harvests: [],
      areaHa: 3,
    });
    expect(result.totalCost).toBe(150);
    expect(result.totalRevenue).toBe(0);
    expect(result.harvestedQuantity).toEqual([]);
    expect(result.costPerUnit).toBeNull();
    expect(result.yieldPerHa).toBeNull();
    expect(result.netProfit).toBe(-150);
    expect(result.marginPct).toBeNull();
  });

  it("LOSS CASE: cost far exceeds revenue → negative netProfit and marginPct", () => {
    const result = computeSeasonCalculation({
      expenseAmounts: [3000],
      harvests: [{ unit: "kg", quantity: 100, revenue: 1000 }],
      areaHa: 2,
    });
    expect(result.netProfit).toBe(-2000);
    expect(result.marginPct).toBe(-200);
    expect(result.costPerUnit).toBe(30);
  });

  it("a season with zero expenses still reports revenue/quantity honestly", () => {
    const result = computeSeasonCalculation({
      expenseAmounts: [],
      harvests: [{ unit: "kg", quantity: 50, revenue: 1000 }],
      areaHa: 1,
    });
    expect(result.totalCost).toBe(0);
    expect(result.costPerUnit).toBe(0);
    expect(result.netProfit).toBe(1000);
    expect(result.marginPct).toBe(100);
  });
});

describe("computeOverallCostPerUnit — weighted across seasons, only when units agree", () => {
  it("computes a WEIGHTED average (total cost / total qty), not an average of per-row rates", () => {
    // Row A: 1000/5 = 200 €/ton. Row B: 300/1 = 300 €/ton.
    // Naive average of rates = 250. Weighted = (1000+300)/(5+1) = 216.67.
    const result = computeOverallCostPerUnit([
      {
        costPerUnitUnit: "ton",
        costPerUnit: 200,
        totalCost: 1000,
        harvestedQuantity: [{ unit: "ton", quantity: 5 }],
      },
      {
        costPerUnitUnit: "ton",
        costPerUnit: 300,
        totalCost: 300,
        harvestedQuantity: [{ unit: "ton", quantity: 1 }],
      },
    ]);
    expect(result.costPerUnitUnit).toBe("ton");
    expect(result.costPerUnit).toBeCloseTo(1300 / 6, 10);
    expect(result.costPerUnit).not.toBe(250);
  });

  it("is '—' (null) when eligible seasons don't share one unit", () => {
    const result = computeOverallCostPerUnit([
      {
        costPerUnitUnit: "ton",
        costPerUnit: 200,
        totalCost: 1000,
        harvestedQuantity: [{ unit: "ton", quantity: 5 }],
      },
      {
        costPerUnitUnit: "kg",
        costPerUnit: 5,
        totalCost: 500,
        harvestedQuantity: [{ unit: "kg", quantity: 100 }],
      },
    ]);
    expect(result.costPerUnit).toBeNull();
    expect(result.costPerUnitUnit).toBeNull();
  });

  it("is '—' (null) when there are no eligible seasons at all", () => {
    const result = computeOverallCostPerUnit([]);
    expect(result.costPerUnit).toBeNull();
    expect(result.costPerUnitUnit).toBeNull();
  });

  it("ignores seasons without their own valid cost/unit (mixed/no harvests)", () => {
    const result = computeOverallCostPerUnit([
      {
        costPerUnitUnit: "ton",
        costPerUnit: 200,
        totalCost: 1000,
        harvestedQuantity: [{ unit: "ton", quantity: 5 }],
      },
      // No coherent unit for this season — must be excluded, not counted as 0.
      { costPerUnitUnit: null, costPerUnit: null, totalCost: 400, harvestedQuantity: [] },
    ]);
    expect(result.costPerUnitUnit).toBe("ton");
    expect(result.costPerUnit).toBe(200);
  });
});

describe("computeReportSummary — dashboard-level totals across seasons", () => {
  const rows = [
    {
      totalRevenue: 2000,
      totalCost: 1000,
      costPerUnitUnit: "ton",
      costPerUnit: 200,
      harvestedQuantity: [{ unit: "ton", quantity: 5 }],
    },
    {
      totalRevenue: 500,
      totalCost: 300,
      costPerUnitUnit: "ton",
      costPerUnit: 300,
      harvestedQuantity: [{ unit: "ton", quantity: 1 }],
    },
  ];

  it("sums revenue and cost across all seasons", () => {
    const summary = computeReportSummary(rows);
    expect(summary.totalRevenue).toBe(2500);
    expect(summary.totalCost).toBe(1300);
    expect(summary.netProfit).toBe(1200);
  });

  it("reports seasonsCount as the number of rows", () => {
    expect(computeReportSummary(rows).seasonsCount).toBe(2);
    expect(computeReportSummary([]).seasonsCount).toBe(0);
  });

  it("overall marginPct follows the same total-revenue guard as a single season", () => {
    const zeroRevenueRows = [
      { totalRevenue: 0, totalCost: 500, costPerUnitUnit: null, costPerUnit: null, harvestedQuantity: [] },
    ];
    expect(computeReportSummary(zeroRevenueRows).marginPct).toBeNull();
  });

  it("overall marginPct is negative when total cost exceeds total revenue", () => {
    const lossRows = [
      { totalRevenue: 100, totalCost: 900, costPerUnitUnit: null, costPerUnit: null, harvestedQuantity: [] },
    ];
    const summary = computeReportSummary(lossRows);
    expect(summary.netProfit).toBe(-800);
    expect(summary.marginPct).toBe(-800);
  });

  it("empty season list produces all-zero/null totals, not an error", () => {
    const summary = computeReportSummary([]);
    expect(summary).toEqual({
      seasonsCount: 0,
      totalRevenue: 0,
      totalCost: 0,
      netProfit: 0,
      marginPct: null,
      costPerUnit: null,
      costPerUnitUnit: null,
    });
  });
});

// ---------------------------------------------------------------------------
// Known discrepancy check (none found)
// ---------------------------------------------------------------------------
// Every test above passed against the EXISTING formulas in
// lib/reports/calculations.ts (extracted verbatim from the previous inline
// logic in app/api/reports/route.ts — see that file's git history for the
// before/after diff). No behavior was changed during extraction; no bug in
// the formulas themselves was found while writing this suite. If a future
// change to this file breaks one of the named cases above (e.g. the
// yieldPerHa-is-0-not-null-at-zero-quantity case), treat that as a real
// regression to report, not something to "fix" by editing the test.
