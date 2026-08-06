import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { cropSchema } from "@/lib/validations/crop";

function serializeCrop(crop: {
  id: string;
  name: string;
  category: string | null;
  standardUnit: string | null;
  createdById: string | null;
  createdAt: Date;
}) {
  return {
    id: crop.id,
    name: crop.name,
    category: crop.category,
    standardUnit: crop.standardUnit,
    isDefault: crop.createdById === null,
    createdAt: crop.createdAt,
  };
}

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();

  // Crops are global — no ownership filter. Alphabetical within each group,
  // AgroDitari defaults (createdById null) listed before user-created ones.
  const crops = await prisma.crop.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" as const } } : undefined,
    orderBy: { name: "asc" },
  });

  const defaults = crops.filter((crop) => crop.createdById === null);
  const userCreated = crops.filter((crop) => crop.createdById !== null);

  return NextResponse.json(
    [...defaults, ...userCreated].map(serializeCrop)
  );
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `crop-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(cropSchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  try {
    const crop = await prisma.crop.create({
      data: {
        name: result.data.name,
        category: result.data.category || null,
        standardUnit: result.data.standardUnit,
        createdById: session.user.id,
      },
    });
    return NextResponse.json(serializeCrop(crop), { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return apiError(409, "Kjo kulturë ekziston tashmë.");
    }
    throw err;
  }
});