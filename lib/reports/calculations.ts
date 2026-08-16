// Pure calculation functions for the reports API (app/api/reports/route.ts).
// No Prisma, no I/O — plain numbers in, numbers (or null) out, so the core
// formulas of the thesis (cost/unit, yield, margin, totals) can be unit
// tested without a database.
//
// A field is `null` (rendered "—" in the UI) whenever its denominator is
// zero, missing, or — for cost/unit and yield — ambiguous because a season's
// harvests used more than one unit. Quantities are grouped by unit and are
// NEVER summed across different units.

import type { ReportQuantity } from "@/types/report";

export type { ReportQuantity };

export type HarvestForTotals = {
  revenue: number | null;
};

export type HarvestForQuantity = {
  unit: string;
  quantity: number;
};

// Shpenzime totale = SUM(expense.amount).
export function sumTotalCost(expenseAmounts: number[]): number {
  return expenseAmounts.reduce((sum, amount) => sum + amount, 0);
}

// Të ardhura = SUM(harvest.revenue); a harvest with no revenue recorded
// contributes 0, it is never dropped or treated as missing data.
export function sumTotalRevenue(harvests: HarvestForTotals[]): number {
  return harvests.reduce((sum, harvest) => sum + (harvest.revenue ?? 0), 0);
}

// Sasia e korrur = SUM(harvest.quantity), grouped by unit. Insertion order of
// first appearance is preserved (a Map iterates in insertion order), which
// is the same order app/api/reports/route.ts has always produced.
export function groupQuantityByUnit(
  harvests: HarvestForQuantity[]
): ReportQuantity[] {
  const byUnit = new Map<string, number>();
  for (const harvest of harvests) {
    byUnit.set(harvest.unit, (byUnit.get(harvest.unit) ?? 0) + harvest.quantity);
  }
  return Array.from(byUnit.entries()).map(([unit, quantity]) => ({
    unit,
    quantity,
  }));
}

// A season's harvests resolve to a single coherent quantity only when every
// harvest used the same unit. Zero harvests or mixed units both mean there
// is no one number to report cost/unit or yield against.
export function singleUnitQuantity(
  harvestedQuantity: ReportQuantity[]
): ReportQuantity | null {
  return harvestedQuantity.length === 1 ? harvestedQuantity[0] : null;
}

// Fitimi neto = Të ardhura − Shpenzime totale.
export function computeNetProfit(totalRevenue: number, totalCost: number): number {
  return totalRevenue - totalCost;
}

// Marxhini % = (Fitimi neto / Të ardhura) × 100, null ("—") when revenue is 0
// — a margin of profit-over-nothing is undefined, not zero or infinite.
export function computeMarginPct(
  netProfit: number,
  totalRevenue: number
): number | null {
  return totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : null;
}

// Kosto/njësi = Shpenzime totale / Sasia e korrur, null ("—") when there is
// no single-unit quantity or that quantity is 0.
export function computeCostPerUnit(
  totalCost: number,
  singleUnit: ReportQuantity | null
): number | null {
  return singleUnit && singleUnit.quantity > 0
    ? totalCost / singleUnit.quantity
    : null;
}

// Rendimenti = Sasia e korrur / parcel.areaHa, null ("—") when there is no
// single-unit quantity or the parcel's area is 0.
export function computeYieldPerHa(
  areaHa: number,
  singleUnit: ReportQuantity | null
): number | null {
  return singleUnit && areaHa > 0 ? singleUnit.quantity / areaHa : null;
}

export type SeasonCalculationInput = {
  expenseAmounts: number[];
  harvests: (HarvestForTotals & HarvestForQuantity)[];
  areaHa: number;
};

export type SeasonCalculationResult = {
  totalCost: number;
  totalRevenue: number;
  harvestedQuantity: ReportQuantity[];
  netProfit: number;
  marginPct: number | null;
  costPerUnit: number | null;
  costPerUnitUnit: string | null;
  yieldPerHa: number | null;
  yieldUnit: string | null;
};

// The full per-season computation, composed from the pieces above — this is
// exactly what app/api/reports/route.ts runs for each crop season row.
export function computeSeasonCalculation(
  input: SeasonCalculationInput
): SeasonCalculationResult {
  const totalCost = sumTotalCost(input.expenseAmounts);
  const totalRevenue = sumTotalRevenue(input.harvests);
  const harvestedQuantity = groupQuantityByUnit(input.harvests);
  const singleUnit = singleUnitQuantity(harvestedQuantity);
  const netProfit = computeNetProfit(totalRevenue, totalCost);
  const marginPct = computeMarginPct(netProfit, totalRevenue);
  const costPerUnit = computeCostPerUnit(totalCost, singleUnit);
  const yieldPerHa = computeYieldPerHa(input.areaHa, singleUnit);

  return {
    totalCost,
    totalRevenue,
    harvestedQuantity,
    netProfit,
    marginPct,
    costPerUnit,
    costPerUnitUnit: singleUnit ? singleUnit.unit : null,
    yieldPerHa,
    yieldUnit: singleUnit ? singleUnit.unit : null,
  };
}

export type OverallCostPerUnitRow = {
  costPerUnitUnit: string | null;
  costPerUnit: number | null;
  totalCost: number;
  harvestedQuantity: ReportQuantity[];
};

// Overall cost/unit across seasons is only meaningful when every season that
// has its OWN valid cost/unit shares the same harvest unit — otherwise
// summing their quantities would mix units, so it stays "—" (both null).
// A weighted average (total cost ÷ total quantity), not an average of
// per-season cost/unit values, which would over-weight small seasons.
export function computeOverallCostPerUnit(
  rows: OverallCostPerUnitRow[]
): { costPerUnit: number | null; costPerUnitUnit: string | null } {
  const eligible = rows.filter(
    (row) => row.costPerUnitUnit !== null && row.costPerUnit !== null
  );
  const distinctUnits = new Set(eligible.map((row) => row.costPerUnitUnit));

  if (eligible.length === 0 || distinctUnits.size !== 1) {
    return { costPerUnit: null, costPerUnitUnit: null };
  }

  const unit = eligible[0].costPerUnitUnit;
  const costSum = eligible.reduce((sum, row) => sum + row.totalCost, 0);
  const qtySum = eligible.reduce(
    (sum, row) =>
      sum + (row.harvestedQuantity.find((h) => h.unit === unit)?.quantity ?? 0),
    0
  );

  if (qtySum <= 0) {
    return { costPerUnit: null, costPerUnitUnit: null };
  }

  return { costPerUnit: costSum / qtySum, costPerUnitUnit: unit };
}

export type SummaryRow = OverallCostPerUnitRow & {
  totalRevenue: number;
};

export type ReportSummaryCalculation = {
  seasonsCount: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  marginPct: number | null;
  costPerUnit: number | null;
  costPerUnitUnit: string | null;
};

// The dashboard-level summary across all of a user's (filtered) seasons.
export function computeReportSummary(
  rows: SummaryRow[]
): ReportSummaryCalculation {
  const totalRevenue = rows.reduce((sum, row) => sum + row.totalRevenue, 0);
  const totalCost = rows.reduce((sum, row) => sum + row.totalCost, 0);
  const netProfit = computeNetProfit(totalRevenue, totalCost);
  const marginPct = computeMarginPct(netProfit, totalRevenue);
  const { costPerUnit, costPerUnitUnit } = computeOverallCostPerUnit(rows);

  return {
    seasonsCount: rows.length,
    totalRevenue,
    totalCost,
    netProfit,
    marginPct,
    costPerUnit,
    costPerUnitUnit,
  };
}
