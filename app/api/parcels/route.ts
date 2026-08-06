import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { parcelSchema } from "@/lib/validations/parcel";
import { parcelInclude, serializeParcel } from "./_shared";

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const farmIdParam = request.nextUrl.searchParams.get("farmId")?.trim();
  // The farmId column is Postgres `uuid` — an invalid value passed straight
  // through would make Prisma throw at the DB layer instead of failing
  // validation, so only apply the filter when it's actually a valid uuid.
  const farmId =
    farmIdParam && parcelSchema.shape.farmId.safeParse(farmIdParam).success
      ? farmIdParam
      : undefined;

  const parcels = await prisma.parcel.findMany({
    where: {
      // Two-hop ownership: a parcel is only visible if its farm belongs to
      // the current user — there is no direct userId on Parcel.
      farm: { userId: session.user.id },
      ...(farmId ? { farmId } : {}),
      ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    },
    include: parcelInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(parcels.map(serializeParcel));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `parcel-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(parcelSchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  // Verify the given farm belongs to the current user before creating the
  // parcel under it — never reveal that a farm exists if it isn't theirs.
  const farm = await prisma.farm.findUnique({
    where: { id: result.data.farmId },
  });
  if (!farm || farm.userId !== session.user.id) {
    return apiError(404, "Ferma nuk u gjet.");
  }

  try {
    const parcel = await prisma.parcel.create({
      data: {
        farmId: result.data.farmId,
        name: result.data.name,
        areaHa: result.data.areaHa,
        soilType: result.data.soilType || null,
      },
      include: parcelInclude,
    });
    return NextResponse.json(serializeParcel(parcel), { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return apiError(409, "Ke tashmë një parcelë me këtë emër në këtë fermë.");
    }
    throw err;
  }
});