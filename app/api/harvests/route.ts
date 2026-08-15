import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { harvestSchema } from "@/lib/validations/harvest";
import { harvestInclude, serializeHarvest } from "./_shared";

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const cropSeasonIdParam = request.nextUrl.searchParams
    .get("cropSeasonId")
    ?.trim();

  // Guard against a malformed value reaching Prisma — cropSeasonId is a
  // Postgres uuid column, and an invalid literal throws a raw DB error
  // instead of failing validation gracefully.
  const cropSeasonId =
    cropSeasonIdParam &&
    harvestSchema.shape.cropSeasonId.safeParse(cropSeasonIdParam).success
      ? cropSeasonIdParam
      : undefined;

  const harvests = await prisma.harvest.findMany({
    where: {
      // Four-hop ownership: a harvest is only visible if its season's
      // parcel's farm belongs to the current user — there is no direct
      // userId on Harvest.
      cropSeason: { parcel: { farm: { userId: session.user.id } } },
      ...(cropSeasonId ? { cropSeasonId } : {}),
    },
    include: harvestInclude,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(harvests.map(serializeHarvest));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `harvest-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(harvestSchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  // Verify the given season belongs to the current user before creating the
  // harvest under it — never reveal that a season exists if it isn't theirs.
  const season = await prisma.cropSeason.findUnique({
    where: { id: result.data.cropSeasonId },
    include: { parcel: { include: { farm: true } } },
  });
  if (!season || season.parcel.farm.userId !== session.user.id) {
    return apiError(404, "Sezoni nuk u gjet.");
  }

  const harvest = await prisma.harvest.create({
    data: {
      cropSeasonId: result.data.cropSeasonId,
      quantity: result.data.quantity,
      unit: result.data.unit,
      unitPrice: result.data.unitPrice ?? null,
      revenue: result.data.revenue ?? null,
      date: new Date(result.data.date),
    },
    include: harvestInclude,
  });

  return NextResponse.json(serializeHarvest(harvest), { status: 201 });
});