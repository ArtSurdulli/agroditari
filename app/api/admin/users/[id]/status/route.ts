import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { updateUserStatusSchema } from "@/lib/validations/admin";
import { requireAdminSession } from "@/lib/admin/guard";
import { canManageTargetRole } from "@/lib/admin/permissions";

type RouteContext = { params: Promise<{ id: string }> };

// Activate/deactivate a user — a reversible status flip, never a delete.
// A superadmin account is never editable here, an admin can only be edited
// by a superadmin, and nobody can flip their own status (avoids an admin
// locking themselves out by accident).
export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const guard = await requireAdminSession();
    if (!guard.ok) return guard.response;
    const { session } = guard;

    const { id } = await params;

    const { success: rateLimitOk } = await checkRateLimit(
      `admin-user-status:${session.user.id}`,
      20,
      "60 s"
    );
    if (!rateLimitOk) {
      return apiError(429, "Shumë përpjekje. Provo më vonë.");
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return apiError(404, "Përdoruesi nuk u gjet.");
    }
    if (id === session.user.id) {
      return apiError(403, "Nuk mund ta ndryshosh statusin e llogarisë tënde.");
    }
    if (!canManageTargetRole(session.user.role, target.role)) {
      return apiError(403, "Nuk keni akses për këtë përdorues.");
    }

    const body = await request.json();
    const result = validate(updateUserStatusSchema, body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status: result.data.status },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated);
  }
);
