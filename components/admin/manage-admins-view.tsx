"use client";

import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { LoadingButton } from "@/components/common/loading-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/admin/user-badges";
import { useAdminSession } from "@/components/admin/admin-context";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/use-admin";

// Superadmin-only page (also enforced by proxy.ts, the layout's role check,
// and this page's own server-side re-check in app/admin/manage-admins/page.tsx).
// Promoting now happens from /admin/users (same superadmin-only role check,
// server-enforced by app/api/admin/users/[id]/role/route.ts) — this page is
// just the roster of current admins, with demote still available here too.
export function ManageAdminsView() {
  const { userId: myId } = useAdminSession();

  const { data, isLoading: adminsLoading } = useAdminUsers({
    role: "admin",
    pageSize: 100,
  });
  const updateRole = useUpdateUserRole();

  async function handleDemote(id: string) {
    try {
      await updateRole.mutateAsync({ id, role: "farmer" });
      toast.success("Adminit iu hoq roli.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ndodhi një gabim. Provo përsëri.");
    }
  }

  const adminRows = data?.users ?? [];

  return (
    <div>
      <PageHeader
        title="Menaxho adminët"
        subtitle="Vetëm superadmin mund të bëjë ose të heqë dikë admin."
      />

      <p className="mt-4 text-sm text-text-secondary">
        Për të bërë dikë admin, shko te{" "}
        <Link href="/admin/users" className="font-medium underline underline-offset-2">
          faqja e Përdoruesve
        </Link>{" "}
        dhe përdor &ldquo;Bëj admin&rdquo; te rreshti i fermerit.
      </p>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-text-primary">Adminët aktualë</h2>
        <div className="mt-3">
          {adminsLoading ? (
            <ListSkeleton rows={3} columns={4} />
          ) : adminRows.length === 0 ? (
            <EmptyState title="Ende s'ka adminë." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emri</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Statusi</TableHead>
                    <TableHead className="text-right">Veprime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminRows.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium text-text-primary">
                        {admin.name}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {admin.email}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={admin.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <LoadingButton
                          variant="outline"
                          size="sm"
                          disabled={admin.id === myId}
                          loading={
                            updateRole.isPending &&
                            updateRole.variables?.id === admin.id
                          }
                          onClick={() => handleDemote(admin.id)}
                        >
                          Hiq nga admin
                        </LoadingButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
