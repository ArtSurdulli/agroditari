import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { validate } from "@/lib/validations";
import { harvestSchema } from "@/lib/validations/harvest";
import { harvestInclude, serializeHarvest } from "../_shared";

type RouteContext = { params: Promise<{ id: string }> };

// Loads a harvest with its season -> parcel -> farm and confirms four-hop
// ownership (harvest -> cropSeason -> parcel -> farm -> user) in one step.
// Callers must treat "not found" and "not owned" identically (404) so
// existence is never leaked.
async function getOwnedHarvest(userId: string, id: string) {
  const harvest = await prisma.harvest.findUnique({
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
  if (!harvest || harvest.cropSeason.parcel.farm.userId !== userId) {
    return null;
  }
  return harvest;
}

export const GET = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const harvest = await getOwnedHarvest(session.user.id, id);
    if (!harvest) {
      return apiError(404, "Korrja nuk u gjet.");
    }

    return NextResponse.json(serializeHarvest(harvest));
  }
);

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedHarvest(session.user.id, id);
    if (!existing) {
      return apiError(404, "Korrja nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(harvestSchema.partial(), body);
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

    const data: Prisma.HarvestUncheckedUpdateInput = {};
    if (result.data.cropSeasonId !== undefined) {
      data.cropSeasonId = result.data.cropSeasonId;
    }
    if (result.data.quantity !== undefined) {
      data.quantity = result.data.quantity;
    }
    if (result.data.unit !== undefined) {
      data.unit = result.data.unit;
    }
    if (result.data.unitPrice !== undefined) {
      data.unitPrice = result.data.unitPrice;
    }
    if (result.data.revenue !== undefined) {
      data.revenue = result.data.revenue;
    }
    if (result.data.date !== undefined) {
      data.date = new Date(result.data.date);
    }

    const harvest = await prisma.harvest.update({
      where: { id },
      data,
      include: harvestInclude,
    });

    return NextResponse.json(serializeHarvest(harvest));
  }
);

export const DELETE = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedHarvest(session.user.id, id);
    if (!existing) {
      return apiError(404, "Korrja nuk u gjet.");
    }

    await prisma.harvest.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);