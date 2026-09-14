import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import { updateUserRoleSchema } from "@/lib/validations/admin";
import { requireSuperadminSession } from "@/lib/admin/guard";
import { canChangeRole } from "@/lib/admin/permissions";

type RouteContext = { params: Promise<{ id: string }> };

// Promote a farmer to admin, or demote an admin back to farmer —
// superadmin-only. Never touches a superadmin account (there is exactly one,
// seeded out-of-band via prisma/seed-superadmin.ts, not created here).
export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const guard = await requireSuperadminSession();
    if (!guard.ok) return guard.response;
    const { session } = guard;

    const { id } = await params;

    const { success: rateLimitOk } = await checkRateLimit(
      `admin-user-role:${session.user.id}`,
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
    if (id === session.user.id || !canChangeRole(session.user.role, target.role)) {
      return apiError(403, "Nuk keni akses për këtë përdorues.");
    }

    const body = await request.json();
    const result = validate(updateUserRoleSchema, body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: result.data.role },
      select: { id: true, role: true },
    });

    return NextResponse.json(updated);
  }
);
