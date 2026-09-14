import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ManageAdminsView } from "@/components/admin/manage-admins-view";

// Superadmin-only page. The layout only checks admin-or-superadmin, and the
// nav item is hidden from admins by AdminShell, but a admin could still
// type this URL directly — this server-side re-check is the actual gate
// (same defense-in-depth pattern as every /api/admin/* route).
export default async function AdminManageAdminsPage() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") {
    redirect("/admin");
  }

  return <ManageAdminsView />;
}
