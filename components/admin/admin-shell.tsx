"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(app)/actions";
import { AdminSessionProvider } from "@/components/admin/admin-context";
import { getAdminRoleTheme, type AdminRole } from "@/lib/admin-theme";
import { cn } from "@/lib/utils";

type AdminNavItem = { href: string; label: string };

const BASE_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Përmbledhje" },
  { href: "/admin/users", label: "Përdoruesit" },
  { href: "/admin/crops", label: "Kulturat" },
];

const SUPERADMIN_NAV_ITEM: AdminNavItem = {
  href: "/admin/manage-admins",
  label: "Menaxho adminët",
};

type AdminShellProps = {
  role: AdminRole;
  userId: string;
  user?: { name?: string | null; email?: string | null };
  children: React.ReactNode;
};

// Same structural layout for admin and superadmin — only the color tokens
// (lib/admin-theme.ts) differ, per the spec. Superadmin additionally gets
// the "Menaxho adminët" tab that admin never sees.
export function AdminShell({ role, userId, user, children }: AdminShellProps) {
  const pathname = usePathname();
  const theme = getAdminRoleTheme(role);
  const Icon = theme.icon;
  const navItems =
    role === "superadmin" ? [...BASE_NAV, SUPERADMIN_NAV_ITEM] : BASE_NAV;

  return (
    <div className="min-h-screen bg-bg-page">
      <header
        className="border-b"
        style={{
          borderColor: theme.color.border,
          backgroundColor: theme.color.tint,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: theme.color.badgeBg }}
            >
              <Icon className="h-5 w-5" style={{ color: theme.color.solid }} />
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: theme.color.textStrong }}
              >
                AgroDitari · {theme.label}
              </p>
              {(user?.name || user?.email) && (
                <p
                  className="truncate text-xs"
                  style={{ color: theme.color.textSoft }}
                >
                  {user?.name ?? user?.email}
                </p>
              )}
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: theme.color.textStrong }}
            >
              <LogOut className="h-4 w-4" />
              Dil
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                )}
                style={
                  isActive
                    ? { backgroundColor: theme.color.solid, color: "#fff" }
                    : { color: theme.color.textSoft }
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <AdminSessionProvider value={{ role, userId }}>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>
      </AdminSessionProvider>
    </div>
  );
}
