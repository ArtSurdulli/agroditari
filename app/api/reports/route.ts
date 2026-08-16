import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { reportsQuerySchema } from "@/lib/validations/report";
import {
  computeReportSummary,
  computeSeasonCalculation,
} from "@/lib/reports/calculations";
import type { ReportResponse, ReportSeasonRow } from "@/types/report";

// Reports are read/compute only — there is no writable "report" entity, no
// schema change, and no POST/PATCH/DELETE here.
export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const searchParams = request.nextUrl.searchParams;
  const seasonIdParam = searchParams.get("seasonId")?.trim();
  const parcelIdParam = searchParams.get("parcelId")?.trim();
  const fromParam = searchParams.get("from")?.trim();
  const toParam = searchParams.get("to")?.trim();

  // Malformed filters are dropped, not errored — this is a read endpoint, so
  // a bad filter should just behave like "no filter" instead of a 422.
  const seasonId =
    seasonIdParam &&
    reportsQuerySchema.shape.seasonId.safeParse(seasonIdParam).success
      ? seasonIdParam
      : undefined;
  const parcelId =
    parcelIdParam &&
    reportsQuerySchema.shape.parcelId.safeParse(parcelIdParam).success
      ? parcelIdParam
      : undefined;
  const from =
    fromParam && reportsQuerySchema.shape.from.safeParse(fromParam).success
      ? fromParam
      : undefined;
  const to =
    toParam && reportsQuerySchema.shape.to.safeParse(toParam).success
      ? toParam
      : undefined;

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
      parcel: { farm: { userId: session.user.id } },
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

  const response: ReportResponse = { rows, summary };
  return NextResponse.json(response);
});
