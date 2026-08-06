"use client";

import { useState } from "react";
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
import { useDeleteParcel } from "@/hooks/use-parcels";
import type { Parcel } from "@/types/parcel";

type DeleteParcelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: Parcel | null;
};

export function DeleteParcelDialog({
  open,
  onOpenChange,
  parcel,
}: DeleteParcelDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteParcel = useDeleteParcel();

  async function handleConfirm() {
    if (!parcel) return;
    setError(null);
    try {
      await deleteParcel.mutateAsync(parcel.id);
      onOpenChange(false);
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
          <DialogTitle>Fshi parcelën</DialogTitle>
          <DialogDescription>
            Je i sigurt që dëshiron të fshish parcelën{" "}
            <strong>{parcel?.name}</strong>? Ky veprim nuk kthehet mbrapsht.
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
            loading={deleteParcel.isPending}
            onClick={handleConfirm}
          >
            Fshi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}