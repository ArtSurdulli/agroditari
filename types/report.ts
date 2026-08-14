// Quantity harvested within a season, grouped by unit — never summed across
// different units (e.g. kg and ton stay separate entries).
export type ReportQuantity = {
  unit: string;
  quantity: number;
};

// One row per crop season the user owns. All money figures are EUR, full
// precision (rounding happens only at display time). Fields that depend on a
// zero/missing/ambiguous (mixed-unit) denominator are `null`, rendered "—".
export type ReportSeasonRow = {
  seasonId: string;
  season: string;
  cropName: string;
  parcelName: string;
  farmName: string;
  areaHa: number;
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

export type ReportSummary = {
  seasonsCount: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  marginPct: number | null;
  costPerUnit: number | null;
  costPerUnitUnit: string | null;
};

export type ReportResponse = {
  rows: ReportSeasonRow[];
  summary: ReportSummary;
};
