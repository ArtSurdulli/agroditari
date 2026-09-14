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
import { useDeleteCrop } from "@/hooks/use-admin";
import type { Crop } from "@/types/crop";

type DeleteCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop: Crop | null;
};

// The API refuses (409) if any crop season still references this crop, so
// the only way this fails in practice is "in use" — surfaced here as-is.
export function DeleteCropDialog({ open, onOpenChange, crop }: DeleteCropDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteCrop = useDeleteCrop();

  async function handleConfirm() {
    if (!crop) return;
    setError(null);
    try {
      await deleteCrop.mutateAsync(crop.id);
      onOpenChange(false);
      toast.success("Kultura u fshi.");
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
          <DialogTitle>Fshi kulturën</DialogTitle>
          <DialogDescription>
            Je i sigurt që dëshiron të fshish kulturën{" "}
            <strong>{crop?.name}</strong>? Ky veprim nuk kthehet mbrapsht.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-danger">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anulo
          </Button>
          <LoadingButton
            type="button"
            variant="destructive"
            loading={deleteCrop.isPending}
            onClick={handleConfirm}
          >
            Fshi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
