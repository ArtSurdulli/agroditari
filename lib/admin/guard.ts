// Server-side role guard for every /api/admin/* route — proxy.ts blocks
// non-admins before the request even lands here, but each route re-checks
// independently (defense in depth, same pattern the rest of the app uses for
// ownership checks).
import { auth } from "@/auth";
import { apiError } from "@/lib/api/response";
import { isAdminRole } from "@/lib/admin/permissions";
import type { Session } from "next-auth";

export type AdminGuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: Response };

export async function requireAdminSession(): Promise<AdminGuardResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, response: apiError(401, "Kërkohet identifikimi.") };
  }
  if (!isAdminRole(session.user.role)) {
    return { ok: false, response: apiError(403, "Nuk keni akses.") };
  }
  return { ok: true, session };
}

export async function requireSuperadminSession(): Promise<AdminGuardResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, response: apiError(401, "Kërkohet identifikimi.") };
  }
  if (session.user.role !== "superadmin") {
    return { ok: false, response: apiError(403, "Nuk keni akses.") };
  }
  return { ok: true, session };
}
