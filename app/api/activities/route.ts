import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { activitySchema, activityTypeValues } from "@/lib/validations/activity";

function serializeActivity(activity: {
  id: string;
  cropSeasonId: string;
  activityType: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  cropSeason: {
    season: string;
    parcel: { name: string };
    crop: { name: string };
  };
}) {
  return {
    id: activity.id,
    cropSeasonId: activity.cropSeasonId,
    season: activity.cropSeason.season,
    cropName: activity.cropSeason.crop.name,
    parcelName: activity.cropSeason.parcel.name,
    activityType: activity.activityType,
    date: activity.date,
    notes: activity.notes,
    createdAt: activity.createdAt,
  };
}

const activityInclude = {
  cropSeason: {
    select: {
      season: true,
      parcel: { select: { name: true } },
      crop: { select: { name: true } },
    },
  },
} as const;

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const cropSeasonIdParam = request.nextUrl.searchParams
    .get("cropSeasonId")
    ?.trim();
  const activityTypeParam = request.nextUrl.searchParams
    .get("activityType")
    ?.trim();

  // Guard both optional filters against malformed values reaching Prisma —
  // cropSeasonId is a Postgres uuid column, activityType a Postgres enum
  // column, and an invalid literal for either throws a raw DB error instead
  // of failing validation gracefully.
  const cropSeasonId =
    cropSeasonIdParam &&
    activitySchema.shape.cropSeasonId.safeParse(cropSeasonIdParam).success
      ? cropSeasonIdParam
      : undefined;
  const activityType =
    activityTypeParam &&
    (activityTypeValues as readonly string[]).includes(activityTypeParam)
      ? (activityTypeParam as (typeof activityTypeValues)[number])
      : undefined;

  const activities = await prisma.activity.findMany({
    where: {
      // Four-hop ownership: an activity is only visible if its season's
      // parcel's farm belongs to the current user — there is no direct
      // userId on Activity.
      cropSeason: { parcel: { farm: { userId: session.user.id } } },
      ...(cropSeasonId ? { cropSeasonId } : {}),
      ...(activityType ? { activityType } : {}),
      ...(q ? { notes: { contains: q, mode: "insensitive" as const } } : {}),
    },
    include: activityInclude,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(activities.map(serializeActivity));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `activity-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(activitySchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  // Verify the given season belongs to the current user before creating the
  // activity under it — never reveal that a season exists if it isn't theirs.
  const season = await prisma.cropSeason.findUnique({
    where: { id: result.data.cropSeasonId },
    include: { parcel: { include: { farm: true } } },
  });
  if (!season || season.parcel.farm.userId !== session.user.id) {
    return apiError(404, "Sezoni nuk u gjet.");
  }

  const activity = await prisma.activity.create({
    data: {
      cropSeasonId: result.data.cropSeasonId,
      activityType: result.data.activityType,
      date: new Date(result.data.date),
      notes: result.data.notes || null,
    },
    include: activityInclude,
  });

  return NextResponse.json(serializeActivity(activity), { status: 201 });
});