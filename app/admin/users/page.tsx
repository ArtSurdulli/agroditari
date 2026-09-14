"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search, Users } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { LoadingButton } from "@/components/common/loading-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoleBadge, StatusBadge } from "@/components/admin/user-badges";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { useAdminSession } from "@/components/admin/admin-context";
import { useAdminUsers, useUpdateUserRole, useUpdateUserStatus } from "@/hooks/use-admin";
import { useDebounce } from "@/hooks/use-debounce";
import { canManageTargetRole } from "@/lib/admin/permissions";
import type { AdminUser } from "@/types/admin";

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sq-AL");
}

export default function AdminUsersPage() {
  const { role: myRole, userId: myId } = useAdminSession();
  const isSuperadmin = myRole === "superadmin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useAdminUsers({
    q: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
  });
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);

  async function toggleStatus(user: AdminUser) {
    const nextStatus = user.status === "active" ? "disabled" : "active";
    try {
      await updateStatus.mutateAsync({ id: user.id, status: nextStatus });
      toast.success(
        nextStatus === "active" ? "Përdoruesi u aktivizua." : "Përdoruesi u çaktivizua."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ndodhi një gabim. Provo përsëri.");
    }
  }

  async function changeRole(user: AdminUser, role: "admin" | "farmer") {
    try {
      await updateRole.mutateAsync({ id: user.id, role });
      toast.success(role === "admin" ? "Përdoruesi u bë admin." : "Adminit iu hoq roli.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ndodhi një gabim. Provo përsëri.");
    }
  }

  const rows = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Përdoruesit"
        subtitle="Të gjithë përdoruesit e sistemit — aktivizo, çaktivizo ose fshi një llogari."
      />

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Kërko sipas emrit ose email-it..."
          className="pl-9"
        />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <ListSkeleton rows={6} columns={6} />
        ) : isError ? (
          <p className="text-sm text-danger">Ndodhi një gabim. Provo përsëri.</p>
        ) : rows.length === 0 ? (
          debouncedSearch ? (
            <EmptyState icon={Search} title="Nuk u gjet asnjë përdorues." description="Provo një kërkim tjetër." />
          ) : (
            <EmptyState icon={Users} title="Ende s'ka përdorues." />
          )
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-border bg-surface">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Emri</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roli</TableHead>
                    <TableHead>Statusi</TableHead>
                    <TableHead>Ferma</TableHead>
                    <TableHead>Regjistruar</TableHead>
                    <TableHead className="text-right">Veprime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((user) => {
                    const isSelf = user.id === myId;
                    const canManage = !isSelf && canManageTargetRole(myRole, user.role);
                    const statusPending =
                      updateStatus.isPending && updateStatus.variables?.id === user.id;
                    const rolePending =
                      updateRole.isPending && updateRole.variables?.id === user.id;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-text-primary">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {user.farmCount}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            {isSuperadmin && !isSelf && user.role === "farmer" && (
                              <LoadingButton
                                variant="outline"
                                size="sm"
                                loading={rolePending}
                                onClick={() => changeRole(user, "admin")}
                              >
                                Bëj admin
                              </LoadingButton>
                            )}
                            {isSuperadmin && !isSelf && user.role === "admin" && (
                              <LoadingButton
                                variant="outline"
                                size="sm"
                                loading={rolePending}
                                onClick={() => changeRole(user, "farmer")}
                              >
                                Hiq nga admin
                              </LoadingButton>
                            )}
                            <LoadingButton
                              variant="outline"
                              size="sm"
                              disabled={!canManage}
                              loading={statusPending}
                              onClick={() => toggleStatus(user)}
                            >
                              {user.status === "active" ? "Çaktivizo" : "Aktivizo"}
                            </LoadingButton>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={!canManage}
                              onClick={() => setUserToDelete(user)}
                            >
                              Fshi
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
              <span>
                Faqja {page} nga {totalPages} ({total} përdorues)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Mëparshme
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Tjetra
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <DeleteUserDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        user={userToDelete}
      />
    </div>
  );
}
