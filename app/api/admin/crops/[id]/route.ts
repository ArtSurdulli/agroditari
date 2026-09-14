import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { cropSchema } from "@/lib/validations/crop";
import { requireAdminSession } from "@/lib/admin/guard";

type RouteContext = { params: Promise<{ id: string }> };

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

// Editing/removing any crop in the global catalog — not ownership-scoped
// (crops are always global), but admin-only: a farmer can still create their
// own crop via POST /api/crops, just not edit or remove someone else's.
export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const guard = await requireAdminSession();
    if (!guard.ok) return guard.response;
    const { session } = guard;

    const { id } = await params;

    const { success: rateLimitOk } = await checkRateLimit(
      `admin-crop-update:${session.user.id}`,
      30,
      "60 s"
    );
    if (!rateLimitOk) {
      return apiError(429, "Shumë përpjekje. Provo më vonë.");
    }

    const existing = await prisma.crop.findUnique({ where: { id } });
    if (!existing) {
      return apiError(404, "Kultura nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(cropSchema, body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    try {
      const crop = await prisma.crop.update({
        where: { id },
        data: {
          name: result.data.name,
          category: result.data.category || null,
          standardUnit: result.data.standardUnit,
        },
      });
      return NextResponse.json(serializeCrop(crop));
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return apiError(409, "Kjo kulturë ekziston tashmë.");
      }
      throw err;
    }
  }
);

export const DELETE = withApiHandler(
  async (_request: NextRequest, { params }: RouteContext) => {
    const guard = await requireAdminSession();
    if (!guard.ok) return guard.response;
    const { session } = guard;

    const { id } = await params;

    const { success: rateLimitOk } = await checkRateLimit(
      `admin-crop-delete:${session.user.id}`,
      20,
      "60 s"
    );
    if (!rateLimitOk) {
      return apiError(429, "Shumë përpjekje. Provo më vonë.");
    }

    const existing = await prisma.crop.findUnique({ where: { id } });
    if (!existing) {
      return apiError(404, "Kultura nuk u gjet.");
    }

    const usageCount = await prisma.cropSeason.count({
      where: { cropId: id },
    });
    if (usageCount > 0) {
      return apiError(
        409,
        "Kjo kulturë përdoret në sezone ekzistuese dhe nuk mund të fshihet."
      );
    }

    await prisma.crop.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);
