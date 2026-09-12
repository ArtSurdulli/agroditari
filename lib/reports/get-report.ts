// Shared report data access — used by both the JSON reports API
// (app/api/reports/route.ts) and the PDF export
// (app/api/reports/pdf/route.ts) so the two export paths always read exactly
// the same rows for the same user + filters. Never duplicate this query.

import { prisma } from "@/lib/prisma";
import { reportsQuerySchema } from "@/lib/validations/report";
import {
  computeReportSummary,
  computeSeasonCalculation,
} from "@/lib/reports/calculations";
import type { ReportResponse, ReportSeasonRow } from "@/types/report";

export type ReportFilters = {
  seasonId?: string;
  parcelId?: string;
  from?: string;
  to?: string;
};

// Malformed filters are dropped, not errored — these are read endpoints, so
// a bad filter should just behave like "no filter" instead of a 422.
export function parseReportFilters(
  searchParams: URLSearchParams
): ReportFilters {
  const seasonIdParam = searchParams.get("seasonId")?.trim();
  const parcelIdParam = searchParams.get("parcelId")?.trim();
  const fromParam = searchParams.get("from")?.trim();
  const toParam = searchParams.get("to")?.trim();

  return {
    seasonId:
      seasonIdParam &&
      reportsQuerySchema.shape.seasonId.safeParse(seasonIdParam).success
        ? seasonIdParam
        : undefined,
    parcelId:
      parcelIdParam &&
      reportsQuerySchema.shape.parcelId.safeParse(parcelIdParam).success
        ? parcelIdParam
        : undefined,
    from:
      fromParam && reportsQuerySchema.shape.from.safeParse(fromParam).success
        ? fromParam
        : undefined,
    to:
      toParam && reportsQuerySchema.shape.to.safeParse(toParam).success
        ? toParam
        : undefined,
  };
}

// The full report query + calculation for one user, scoped by ownership
// (parcel.farm.userId) exactly like every other farmer-data query in the app.
export async function getReport(
  userId: string,
  filters: ReportFilters
): Promise<ReportResponse> {
  const { seasonId, parcelId, from, to } = filters;

  // The date range scopes WHICH expense/harvest records are summed (e.g.
  // "this year's numbers"), not which seasons appear in the report — a
  // season still shows up with zeroed figures if it has no records in range.
  const dateRange =
    from || to
      ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : undefined;

  const seasons = await prisma.cropSeason.findMany({
    where: {
      // Ownership: only seasons whose parcel's farm belongs to the current
      // user — there is no direct userId on CropSeason.
      parcel: { farm: { userId } },
      ...(seasonId ? { id: seasonId } : {}),
      ...(parcelId ? { parcelId } : {}),
    },
    include: {
      parcel: {
        select: {
          name: true,
          areaHa: true,
          farm: { select: { name: true } },
        },
      },
      crop: { select: { name: true } },
      expenses: {
        select: { amount: true },
        ...(dateRange ? { where: dateRange } : {}),
      },
      harvests: {
        select: { quantity: true, unit: true, revenue: true },
        ...(dateRange ? { where: dateRange } : {}),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: ReportSeasonRow[] = seasons.map((season) => {
    const calculation = computeSeasonCalculation({
      expenseAmounts: season.expenses.map((expense) => Number(expense.amount)),
      harvests: season.harvests.map((harvest) => ({
        unit: harvest.unit,
        quantity: Number(harvest.quantity),
        revenue: harvest.revenue !== null ? Number(harvest.revenue) : null,
      })),
      areaHa: Number(season.parcel.areaHa),
    });

    return {
      seasonId: season.id,
      season: season.season,
      cropName: season.crop.name,
      parcelName: season.parcel.name,
      farmName: season.parcel.farm.name,
      areaHa: Number(season.parcel.areaHa),
      ...calculation,
    };
  });

  const summary = computeReportSummary(rows);

  return { rows, summary };
}
