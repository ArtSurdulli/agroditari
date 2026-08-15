import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { reminderSchema } from "@/lib/validations/reminder";
import { reminderInclude, serializeReminder } from "./_shared";

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  const doneParam = request.nextUrl.searchParams.get("done");
  const isDone =
    doneParam === "true" ? true : doneParam === "false" ? false : undefined;

  const cropSeasonIdParam = request.nextUrl.searchParams
    .get("cropSeasonId")
    ?.trim();
  // Guard the optional filter against malformed values reaching Prisma —
  // cropSeasonId is a Postgres uuid column, and an invalid literal throws a
  // raw DB error instead of failing validation gracefully.
  const cropSeasonId =
    cropSeasonIdParam &&
    reminderSchema.shape.cropSeasonId.safeParse(cropSeasonIdParam).success
      ? cropSeasonIdParam
      : undefined;

  const reminders = await prisma.reminder.findMany({
    where: {
      userId: session.user.id,
      ...(cropSeasonId ? { cropSeasonId } : {}),
      ...(isDone !== undefined ? { isDone } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    },
    include: reminderInclude,
    // Not-done before done, then soonest due date first.
    orderBy: [{ isDone: "asc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(reminders.map(serializeReminder));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `reminder-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(reminderSchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  // Verify the given season belongs to the current user before linking the
  // reminder to it — never reveal that a season exists if it isn't theirs.
  // Skipped entirely when no season is linked.
  if (result.data.cropSeasonId) {
    const season = await prisma.cropSeason.findUnique({
      where: { id: result.data.cropSeasonId },
      include: { parcel: { include: { farm: true } } },
    });
    if (!season || season.parcel.farm.userId !== session.user.id) {
      return apiError(404, "Sezoni nuk u gjet.");
    }
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId: session.user.id,
      cropSeasonId: result.data.cropSeasonId ?? null,
      title: result.data.title,
      description: result.data.description || null,
      dueDate: new Date(result.data.dueDate),
      isDone: result.data.isDone ?? false,
    },
    include: reminderInclude,
  });

  return NextResponse.json(serializeReminder(reminder), { status: 201 });
});