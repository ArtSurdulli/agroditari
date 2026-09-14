import { z } from "zod";

// An admin can only ever set a user to "active" or "disabled" — "pending" is
// a registration-flow state (awaiting email verification), not something to
// hand-set from the admin UI.
export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "disabled"], {
    error: "Statusi i zgjedhur nuk është i vlefshëm.",
  }),
});

// Promote/demote only ever moves a user between farmer and admin — nobody is
// made superadmin through the API (that role only exists via the seed
// script), and this is superadmin-only regardless.
export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "farmer"], {
    error: "Roli i zgjedhur nuk është i vlefshëm.",
  }),
});
