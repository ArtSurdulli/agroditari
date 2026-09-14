"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/common/loading-button";
import { useDeleteUser } from "@/hooks/use-admin";
import type { AdminUser } from "@/types/admin";

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
};

// Hard delete — deliberately its own dialog (not the default action) with an
// explicit cascade warning, since deleting a user also deletes every farm,
// parcel, season, expense and harvest they own.
export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
}: DeleteUserDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteUser = useDeleteUser();

  async function handleConfirm() {
    if (!user) return;
    setError(null);
    try {
      await deleteUser.mutateAsync(user.id);
      onOpenChange(false);
      toast.success("Përdoruesi u fshi.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ndodhi një gabim. Provo përsëri."
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fshi përdoruesin</DialogTitle>
          <DialogDescription>
            Je i sigurt që dëshiron të fshish përgjithmonë llogarinë e{" "}
            <strong>{user?.name}</strong> ({user?.email})? Kjo do të fshijë
            gjithashtu të gjitha fermat, parcelat, sezonet, shpenzimet dhe
            korrjet e tij/saj ({user?.farmCount ?? 0}{" "}
            {user?.farmCount === 1 ? "fermë" : "ferma"}). Ky veprim{" "}
            <strong>nuk kthehet mbrapsht</strong> — nëse je i pasigurt, përdor{" "}
            &ldquo;Çaktivizo&rdquo; në vend të kësaj.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-danger">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Anulo
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={deleteUser.isPending}
            onClick={handleConfirm}
          >
            Fshi përgjithmonë
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
