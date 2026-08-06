import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import {
  cropSeasonBaseSchema,
  cropSeasonSchema,
  seasonStatusValues,
} from "@/lib/validations/crop-season";

function serializeCropSeason(season: {
  id: string;
  parcelId: string;
  cropId: string;
  season: string;
  status: string;
  sowingDate: Date | null;
  expectedHarvestDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  parcel: { name: string; farm: { name: string } };
  crop: { name: string };
}) {
  return {
    id: season.id,
    parcelId: season.parcelId,
    parcelName: season.parcel.name,
    farmName: season.parcel.farm.name,
    cropId: season.cropId,
    cropName: season.crop.name,
    season: season.season,
    status: season.status,
    sowingDate: season.sowingDate,
    expectedHarvestDate: season.expectedHarvestDate,
    createdAt: season.createdAt,
    updatedAt: season.updatedAt,
  };
}

const seasonInclude = {
  parcel: { select: { name: true, farm: { select: { name: true } } } },
  crop: { select: { name: true } },
} as const;

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const parcelIdParam = request.nextUrl.searchParams.get("parcelId")?.trim();
  const statusParam = request.nextUrl.searchParams.get("status")?.trim();

  // Guard both optional filters against malformed values reaching Prisma —
  // parcelId is a Postgres uuid column, status a Postgres enum column, and
  // an invalid literal for either throws a raw DB error instead of failing
  // validation gracefully.
  const parcelId =
    parcelIdParam &&
    cropSeasonBaseSchema.shape.parcelId.safeParse(parcelIdParam).success
      ? parcelIdParam
      : undefined;
  const status =
    statusParam &&
    (seasonStatusValues as readonly string[]).includes(statusParam)
      ? (statusParam as (typeof seasonStatusValues)[number])
      : undefined;

  const seasons = await prisma.cropSeason.findMany({
    where: {
      // Three-hop ownership: a season is only visible if its parcel's farm
      // belongs to the current user — there is no direct userId on CropSeason.
      parcel: { farm: { userId: session.user.id } },
      ...(parcelId ? { parcelId } : {}),
      ...(status ? { status } : {}),
      ...(q ? { season: { contains: q, mode: "insensitive" as const } } : {}),
    },
    include: seasonInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(seasons.map(serializeCropSeason));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `season-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(cropSeasonSchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  // Verify the given parcel belongs to the current user before creating the
  // season under it — never reveal that a parcel exists if it isn't theirs.
  const parcel = await prisma.parcel.findUnique({
    where: { id: result.data.parcelId },
    include: { farm: true },
  });
  if (!parcel || parcel.farm.userId !== session.user.id) {
    return apiError(404, "Parcela nuk u gjet.");
  }

  // Crops are global — just needs to exist, no ownership check.
  const crop = await prisma.crop.findUnique({
    where: { id: result.data.cropId },
  });
  if (!crop) {
    return apiError(400, "Kultura e zgjedhur nuk ekziston.");
  }

  const season = await prisma.cropSeason.create({
    data: {
      parcelId: result.data.parcelId,
      cropId: result.data.cropId,
      season: result.data.season,
      status: result.data.status ?? "active",
      sowingDate: result.data.sowingDate
        ? new Date(result.data.sowingDate)
        : null,
      expectedHarvestDate: result.data.expectedHarvestDate
        ? new Date(result.data.expectedHarvestDate)
        : null,
    },
    include: seasonInclude,
  });

  return NextResponse.json(serializeCropSeason(season), { status: 201 });
});