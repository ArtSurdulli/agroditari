import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { validate } from "@/lib/validations";
import { parcelSchema } from "@/lib/validations/parcel";
import { parcelInclude, serializeParcel } from "../_shared";

type RouteContext = { params: Promise<{ id: string }> };

// Loads a parcel with its farm and confirms two-hop ownership
// (parcel -> farm -> user) in one step. Callers must treat "not found" and
// "not owned" identically (404) so existence is never leaked.
async function getOwnedParcel(userId: string, id: string) {
  const parcel = await prisma.parcel.findUnique({
    where: { id },
    include: { farm: true },
  });
  if (!parcel || parcel.farm.userId !== userId) return null;
  return parcel;
}

export const GET = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const parcel = await getOwnedParcel(session.user.id, id);
    if (!parcel) {
      return apiError(404, "Parcela nuk u gjet.");
    }

    return NextResponse.json(serializeParcel(parcel));
  }
);

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedParcel(session.user.id, id);
    if (!existing) {
      return apiError(404, "Parcela nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(parcelSchema.partial(), body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    // If the farm is being changed, verify the NEW farm is also owned by
    // the current user before allowing the move.
    if (
      result.data.farmId !== undefined &&
      result.data.farmId !== existing.farmId
    ) {
      const newFarm = await prisma.farm.findUnique({
        where: { id: result.data.farmId },
      });
      if (!newFarm || newFarm.userId !== session.user.id) {
        return apiError(404, "Ferma nuk u gjet.");
      }
    }

    const data: Prisma.ParcelUncheckedUpdateInput = {};
    if (result.data.farmId !== undefined) {
      data.farmId = result.data.farmId;
    }
    if (result.data.name !== undefined) {
      data.name = result.data.name;
    }
    if (result.data.areaHa !== undefined) {
      data.areaHa = result.data.areaHa;
    }
    if (result.data.soilType !== undefined) {
      data.soilType = result.data.soilType === "" ? null : result.data.soilType;
    }

    try {
      const parcel = await prisma.parcel.update({
        where: { id },
        data,
        include: parcelInclude,
      });
      return NextResponse.json(serializeParcel(parcel));
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return apiError(
          409,
          "Ke tashmë një parcelë me këtë emër në këtë fermë."
        );
      }
      throw err;
    }
  }
);

export const DELETE = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedParcel(session.user.id, id);
    if (!existing) {
      return apiError(404, "Parcela nuk u gjet.");
    }

    await prisma.parcel.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);