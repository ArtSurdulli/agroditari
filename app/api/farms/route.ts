import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { farmSchema } from "@/lib/validations/farm";

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();

  const farms = await prisma.farm.findMany({
    where: {
      userId: session.user.id,
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    },
    // Row-summary rollups for the list — lightweight selects, one query
    // instead of N requests per row.
    include: {
      parcels: {
        select: { areaHa: true, cropSeasons: { select: { status: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const farmsWithStats = farms.map(({ parcels, ...farm }) => ({
    ...farm,
    parcelCount: parcels.length,
    totalAreaHa: parcels.reduce((sum, parcel) => sum + Number(parcel.areaHa), 0),
    activeSeasonCount: parcels.reduce(
      (sum, parcel) =>
        sum + parcel.cropSeasons.filter((season) => season.status === "active").length,
      0
    ),
  }));

  return NextResponse.json(farmsWithStats);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `farm-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(farmSchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  try {
    const farm = await prisma.farm.create({
      data: {
        userId: session.user.id,
        name: result.data.name,
        location: result.data.location || null,
      },
    });
    return NextResponse.json(farm, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return apiError(409, "Ke tashmë një fermë me këtë emër.");
    }
    throw err;
  }
});