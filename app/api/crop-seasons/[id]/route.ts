import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { validate } from "@/lib/validations";
import { cropSeasonBaseSchema } from "@/lib/validations/crop-season";
import { seasonInclude, serializeCropSeason } from "../_shared";

type RouteContext = { params: Promise<{ id: string }> };

// Loads a season with its parcel -> farm and confirms three-hop ownership
// (season -> parcel -> farm -> user) in one step. Callers must treat
// "not found" and "not owned" identically (404) so existence is never leaked.
async function getOwnedSeason(userId: string, id: string) {
  const season = await prisma.cropSeason.findUnique({
    where: { id },
    include: {
      parcel: { include: { farm: true } },
      crop: true,
    },
  });
  if (!season || season.parcel.farm.userId !== userId) return null;
  return season;
}

export const GET = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const season = await getOwnedSeason(session.user.id, id);
    if (!season) {
      return apiError(404, "Sezoni nuk u gjet.");
    }

    return NextResponse.json(serializeCropSeason(season));
  }
);

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedSeason(session.user.id, id);
    if (!existing) {
      return apiError(404, "Sezoni nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(cropSeasonBaseSchema.partial(), body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    // If the parcel is being changed, verify the NEW parcel is also owned by
    // the current user before allowing the move.
    if (
      result.data.parcelId !== undefined &&
      result.data.parcelId !== existing.parcelId
    ) {
      const newParcel = await prisma.parcel.findUnique({
        where: { id: result.data.parcelId },
        include: { farm: true },
      });
      if (!newParcel || newParcel.farm.userId !== session.user.id) {
        return apiError(404, "Parcela nuk u gjet.");
      }
    }

    // Crops are global — just needs to exist, no ownership check.
    if (result.data.cropId !== undefined) {
      const crop = await prisma.crop.findUnique({
        where: { id: result.data.cropId },
      });
      if (!crop) {
        return apiError(400, "Kultura e zgjedhur nuk ekziston.");
      }
    }

    // Cross-field date-order validation has to run against the merged
    // existing + incoming record, since a partial payload may only touch one
    // of the two dates.
    const nextSowingDate =
      result.data.sowingDate !== undefined
        ? (result.data.sowingDate ?? null)
        : (existing.sowingDate?.toISOString().slice(0, 10) ?? null);
    const nextExpectedHarvestDate =
      result.data.expectedHarvestDate !== undefined
        ? (result.data.expectedHarvestDate ?? null)
        : (existing.expectedHarvestDate?.toISOString().slice(0, 10) ?? null);

    if (
      nextSowingDate &&
      nextExpectedHarvestDate &&
      nextExpectedHarvestDate <= nextSowingDate
    ) {
      return apiError(422, "Të dhëna të pavlefshme.", {
        expectedHarvestDate:
          "Data e korrjes duhet të jetë pas datës së mbjelljes.",
      });
    }

    const data: Prisma.CropSeasonUncheckedUpdateInput = {};
    if (result.data.parcelId !== undefined) {
      data.parcelId = result.data.parcelId;
    }
    if (result.data.cropId !== undefined) {
      data.cropId = result.data.cropId;
    }
    if (result.data.season !== undefined) {
      data.season = result.data.season;
    }
    if (result.data.status !== undefined) {
      data.status = result.data.status;
    }
    if (result.data.sowingDate !== undefined) {
      data.sowingDate = result.data.sowingDate
        ? new Date(result.data.sowingDate)
        : null;
    }
    if (result.data.expectedHarvestDate !== undefined) {
      data.expectedHarvestDate = result.data.expectedHarvestDate
        ? new Date(result.data.expectedHarvestDate)
        : null;
    }

    const season = await prisma.cropSeason.update({
      where: { id },
      data,
      include: seasonInclude,
    });

    return NextResponse.json(serializeCropSeason(season));
  }
);

export const DELETE = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedSeason(session.user.id, id);
    if (!existing) {
      return apiError(404, "Sezoni nuk u gjet.");
    }

    await prisma.cropSeason.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);