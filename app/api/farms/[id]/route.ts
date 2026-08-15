import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { validate } from "@/lib/validations";
import { farmSchema } from "@/lib/validations/farm";

type RouteContext = { params: Promise<{ id: string }> };

// Loads a farm and confirms ownership in one step. Callers must treat "not
// found" and "not owned" identically (404) so existence is never leaked.
async function getOwnedFarm(userId: string, id: string) {
  const farm = await prisma.farm.findUnique({ where: { id } });
  if (!farm || farm.userId !== userId) return null;
  return farm;
}

export const GET = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const farm = await getOwnedFarm(session.user.id, id);
    if (!farm) {
      return apiError(404, "Ferma nuk u gjet.");
    }

    return NextResponse.json(farm);
  }
);

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedFarm(session.user.id, id);
    if (!existing) {
      return apiError(404, "Ferma nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(farmSchema.partial(), body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    const data: Prisma.FarmUpdateInput = {};
    if (result.data.name !== undefined) {
      data.name = result.data.name;
    }
    if (result.data.location !== undefined) {
      data.location = result.data.location === "" ? null : result.data.location;
    }

    try {
      const farm = await prisma.farm.update({ where: { id }, data });
      return NextResponse.json(farm);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return apiError(409, "Ke tashmë një fermë me këtë emër.");
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
    const existing = await getOwnedFarm(session.user.id, id);
    if (!existing) {
      return apiError(404, "Ferma nuk u gjet.");
    }

    await prisma.farm.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);