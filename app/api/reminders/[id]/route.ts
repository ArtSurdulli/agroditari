import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { validate } from "@/lib/validations";
import { reminderSchema } from "@/lib/validations/reminder";
import { reminderInclude, serializeReminder } from "../_shared";

type RouteContext = { params: Promise<{ id: string }> };

// Loads a reminder and confirms ownership in one step. Ownership is direct
// (reminder.userId), the simplest case, like farms. Callers must treat "not
// found" and "not owned" identically (404) so existence is never leaked.
async function getOwnedReminder(userId: string, id: string) {
  const reminder = await prisma.reminder.findUnique({
    where: { id },
    include: reminderInclude,
  });
  if (!reminder || reminder.userId !== userId) return null;
  return reminder;
}

export const GET = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const reminder = await getOwnedReminder(session.user.id, id);
    if (!reminder) {
      return apiError(404, "Kujtesa nuk u gjet.");
    }

    return NextResponse.json(serializeReminder(reminder));
  }
);

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedReminder(session.user.id, id);
    if (!existing) {
      return apiError(404, "Kujtesa nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(reminderSchema.partial(), body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    // If the season is being changed (including unlinking to null), verify
    // the new season is owned by the current user before allowing the move.
    // Skipped when cropSeasonId isn't present in the payload at all.
    if (
      result.data.cropSeasonId !== undefined &&
      result.data.cropSeasonId !== existing.cropSeasonId
    ) {
      if (result.data.cropSeasonId !== null) {
        const newSeason = await prisma.cropSeason.findUnique({
          where: { id: result.data.cropSeasonId },
          include: { parcel: { include: { farm: true } } },
        });
        if (!newSeason || newSeason.parcel.farm.userId !== session.user.id) {
          return apiError(404, "Sezoni nuk u gjet.");
        }
      }
    }

    const data: Prisma.ReminderUncheckedUpdateInput = {};
    if (result.data.cropSeasonId !== undefined) {
      data.cropSeasonId = result.data.cropSeasonId;
    }
    if (result.data.title !== undefined) {
      data.title = result.data.title;
    }
    if (result.data.description !== undefined) {
      data.description =
        result.data.description === "" ? null : result.data.description;
    }
    if (result.data.dueDate !== undefined) {
      data.dueDate = new Date(result.data.dueDate);
    }
    if (result.data.isDone !== undefined) {
      data.isDone = result.data.isDone;
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data,
      include: reminderInclude,
    });

    return NextResponse.json(serializeReminder(reminder));
  }
);

export const DELETE = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedReminder(session.user.id, id);
    if (!existing) {
      return apiError(404, "Kujtesa nuk u gjet.");
    }

    await prisma.reminder.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);