// Role hierarchy for the /admin section. Kept as pure functions (no
// Prisma/session I/O) so the rules are easy to unit test and to re-check
// identically on both the server route and the client UI.
//
// Hierarchy: superadmin manages admins and farmers; admin manages farmers
// only; nobody (not even another superadmin) can act on a superadmin
// account, and nobody can act on themselves for destructive/role changes —
// that mirrors the "admin can't touch superadmin, superadmin can't delete
// itself" rule from the spec, generalized to one consistent check.
import type { UserRole } from "@/types/next-auth";

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

// Can `actorRole` change status (activate/deactivate) or delete a user whose
// role is `targetRole`? A superadmin's role/status is never editable through
// the admin UI — it only exists via the seed script.
export function canManageTargetRole(
  actorRole: UserRole,
  targetRole: UserRole
): boolean {
  if (targetRole === "superadmin") return false;
  if (targetRole === "admin") return actorRole === "superadmin";
  return isAdminRole(actorRole);
}

// Promote/demote between admin <-> farmer is superadmin-only, and never
// targets a superadmin (there is exactly one, seeded out-of-band).
export function canChangeRole(actorRole: UserRole, targetRole: UserRole): boolean {
  return actorRole === "superadmin" && targetRole !== "superadmin";
}
