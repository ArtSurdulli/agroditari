import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { validate } from "@/lib/validations";
import { activitySchema } from "@/lib/validations/activity";
import { activityInclude, serializeActivity } from "../_shared";

type RouteContext = { params: Promise<{ id: string }> };

// Loads an activity with its season -> parcel -> farm and confirms four-hop
// ownership (activity -> cropSeason -> parcel -> farm -> user) in one step.
// Callers must treat "not found" and "not owned" identically (404) so
// existence is never leaked.
async function getOwnedActivity(userId: string, id: string) {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: {
      cropSeason: {
        include: {
          parcel: { include: { farm: true } },
          crop: true,
        },
      },
    },
  });
  if (!activity || activity.cropSeason.parcel.farm.userId !== userId) {
    return null;
  }
  return activity;
}

export const GET = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const activity = await getOwnedActivity(session.user.id, id);
    if (!activity) {
      return apiError(404, "Aktiviteti nuk u gjet.");
    }

    return NextResponse.json(serializeActivity(activity));
  }
);

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedActivity(session.user.id, id);
    if (!existing) {
      return apiError(404, "Aktiviteti nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(activitySchema.partial(), body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    // If the season is being changed, verify the NEW season is also owned by
    // the current user before allowing the move.
    if (
      result.data.cropSeasonId !== undefined &&
      result.data.cropSeasonId !== existing.cropSeasonId
    ) {
      const newSeason = await prisma.cropSeason.findUnique({
        where: { id: result.data.cropSeasonId },
        include: { parcel: { include: { farm: true } } },
      });
      if (!newSeason || newSeason.parcel.farm.userId !== session.user.id) {
        return apiError(404, "Sezoni nuk u gjet.");
      }
    }

    const data: Prisma.ActivityUncheckedUpdateInput = {};
    if (result.data.cropSeasonId !== undefined) {
      data.cropSeasonId = result.data.cropSeasonId;
    }
    if (result.data.activityType !== undefined) {
      data.activityType = result.data.activityType;
    }
    if (result.data.date !== undefined) {
      data.date = new Date(result.data.date);
    }
    if (result.data.notes !== undefined) {
      data.notes = result.data.notes === "" ? null : result.data.notes;
    }

    const activity = await prisma.activity.update({
      where: { id },
      data,
      include: activityInclude,
    });

    return NextResponse.json(serializeActivity(activity));
  }
);

export const DELETE = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedActivity(session.user.id, id);
    if (!existing) {
      return apiError(404, "Aktiviteti nuk u gjet.");
    }

    await prisma.activity.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);