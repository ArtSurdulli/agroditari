import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { reportsQuerySchema } from "@/lib/validations/report";
import type {
  ReportQuantity,
  ReportResponse,
  ReportSeasonRow,
  ReportSummary,
} from "@/types/report";

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
    // Shpenzime totale = SUM(expense.amount)
    const totalCost = season.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    );
    // Të ardhura = SUM(harvest.revenue), revenue may be null → treat as 0
    const totalRevenue = season.harvests.reduce(
      (sum, harvest) => sum + Number(harvest.revenue ?? 0),
      0
    );

    // Sasia e korrur = SUM(harvest.quantity), grouped by unit — never summed
    // across different units.
    const quantityByUnit = new Map<string, number>();
    for (const harvest of season.harvests) {
      quantityByUnit.set(
        harvest.unit,
        (quantityByUnit.get(harvest.unit) ?? 0) + Number(harvest.quantity)
      );
    }
    const harvestedQuantity: ReportQuantity[] = Array.from(
      quantityByUnit.entries()
    ).map(([unit, quantity]) => ({ unit, quantity }));

    // Kosto/njësi and Rendimenti both need ONE coherent quantity number,
    // which only exists when every harvest in the season used the same
    // unit — with zero or mixed units they stay "—" (null).
    const singleUnit =
      harvestedQuantity.length === 1 ? harvestedQuantity[0] : null;

    // Fitimi neto = Të ardhura − Shpenzime totale
    const netProfit = totalRevenue - totalCost;
    // Marxhini % = (Fitimi neto / Të ardhura) × 100, "—" if income = 0
    const marginPct =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : null;
    // Kosto/njësi = Shpenzime totale / Sasia e korrur, "—" if quantity = 0
    const costPerUnit =
      singleUnit && singleUnit.quantity > 0
        ? totalCost / singleUnit.quantity
        : null;

    const areaHa = Number(season.parcel.areaHa);
    // Rendimenti = Sasia e korrur / parcel.areaHa, "—" if area = 0
    const yieldPerHa =
      singleUnit && areaHa > 0 ? singleUnit.quantity / areaHa : null;

    return {
      seasonId: season.id,
      season: season.season,
      cropName: season.crop.name,
      parcelName: season.parcel.name,
      farmName: season.parcel.farm.name,
      areaHa,
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
  });

  const totalRevenue = rows.reduce((sum, row) => sum + row.totalRevenue, 0);
  const totalCost = rows.reduce((sum, row) => sum + row.totalCost, 0);
  const netProfit = totalRevenue - totalCost;
  // Overall margin = total profit / total revenue × 100
  const marginPct = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : null;

  // Overall cost/unit is only meaningful when every season contributing a
  // valid per-season cost/unit shares the SAME harvest unit — otherwise
  // summing quantities would mix units, so it stays "—".
  const eligible = rows.filter(
    (row) => row.costPerUnitUnit !== null && row.costPerUnit !== null
  );
  const distinctUnits = new Set(eligible.map((row) => row.costPerUnitUnit));
  let overallCostPerUnit: number | null = null;
  let overallCostPerUnitUnit: string | null = null;
  if (eligible.length > 0 && distinctUnits.size === 1) {
    const unit = eligible[0].costPerUnitUnit;
    const costSum = eligible.reduce((sum, row) => sum + row.totalCost, 0);
    const qtySum = eligible.reduce(
      (sum, row) =>
        sum +
        (row.harvestedQuantity.find((h) => h.unit === unit)?.quantity ?? 0),
      0
    );
    if (qtySum > 0) {
      overallCostPerUnit = costSum / qtySum;
      overallCostPerUnitUnit = unit;
    }
  }

  const summary: ReportSummary = {
    seasonsCount: rows.length,
    totalRevenue,
    totalCost,
    netProfit,
    marginPct,
    costPerUnit: overallCostPerUnit,
    costPerUnitUnit: overallCostPerUnitUnit,
  };

  const response: ReportResponse = { rows, summary };
  return NextResponse.json(response);
});
