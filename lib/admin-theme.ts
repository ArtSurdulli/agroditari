import { ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import type { EntityColor } from "@/lib/entity-theme";
import type { UserRole } from "@/types/next-auth";

// Same color-token shape as lib/entity-theme.ts (so admin pages can reuse
// StatCard/entityAccentStyle unchanged) — admin is blue, superadmin is red,
// per the spec's "same layout, different theme color" requirement.
export type AdminRole = Extract<UserRole, "admin" | "superadmin">;

export type AdminRoleTheme = {
  label: string;
  icon: LucideIcon;
  color: EntityColor;
};

export const adminRoleTheme: Record<AdminRole, AdminRoleTheme> = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    color: {
      tint: "#DBEAFE",
      border: "#3B82F6",
      solid: "#1D4ED8",
      textStrong: "#1E3A8A",
      textSoft: "#1D4ED8",
      badgeBg: "#BFDBFE",
    },
  },
  superadmin: {
    label: "Superadmin",
    icon: ShieldAlert,
    color: {
      tint: "#FEE2E2",
      border: "#EF4444",
      solid: "#B91C1C",
      textStrong: "#7F1D1D",
      textSoft: "#B91C1C",
      badgeBg: "#FECACA",
    },
  },
};

export function getAdminRoleTheme(role: AdminRole): AdminRoleTheme {
  return adminRoleTheme[role];
}
