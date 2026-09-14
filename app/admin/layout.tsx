import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import type { AdminRole } from "@/lib/admin-theme";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// proxy.ts already redirects non-admins away from /admin at the edge — this
// is the defense-in-depth re-check at the page layer, matching the pattern
// every /api/admin/* route also follows (see lib/admin/guard.ts).
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;

  if (role !== "admin" && role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <AdminShell
      role={role as AdminRole}
      userId={session!.user.id}
      user={session!.user}
    >
      {children}
    </AdminShell>
  );
}
