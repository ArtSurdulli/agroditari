import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireAdminSession } from "@/lib/admin/guard";
import { canManageTargetRole } from "@/lib/admin/permissions";

type RouteContext = { params: Promise<{ id: string }> };

// Hard delete — cascades through Farm -> Parcel -> CropSeason -> everything
// beneath it (schema's onDelete: Cascade chain from User). This is why
// deactivate is the primary action; delete exists as a separate, clearly
// destructive one, gated by the same target-role rules as status changes,
// plus: never self, never a superadmin, ever.
export const DELETE = withApiHandler(
  async (_request: NextRequest, { params }: RouteContext) => {
    const guard = await requireAdminSession();
    if (!guard.ok) return guard.response;
    const { session } = guard;

    const { id } = await params;

    const { success: rateLimitOk } = await checkRateLimit(
      `admin-user-delete:${session.user.id}`,
      10,
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
      return apiError(403, "Nuk mund ta fshish llogarinë tënde.");
    }
    if (!canManageTargetRole(session.user.role, target.role)) {
      return apiError(403, "Nuk keni akses për këtë përdorues.");
    }

    await prisma.user.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);
