import { Badge } from "@/components/ui/badge";
import type { UserAccountStatus, UserRole } from "@/types/next-auth";

const roleLabels: Record<UserRole, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  farmer: "Fermer",
};

const statusLabels: Record<UserAccountStatus, string> = {
  pending: "Në pritje",
  active: "Aktiv",
  disabled: "Çaktivizuar",
};

export function RoleBadge({ role }: { role: UserRole }) {
  const variant = role === "farmer" ? "secondary" : "outline";
  return <Badge variant={variant}>{roleLabels[role]}</Badge>;
}

export function StatusBadge({ status }: { status: UserAccountStatus }) {
  if (status === "active") return <Badge>{statusLabels.active}</Badge>;
  if (status === "disabled") {
    return <Badge variant="destructive">{statusLabels.disabled}</Badge>;
  }
  return <Badge variant="secondary">{statusLabels.pending}</Badge>;
}
