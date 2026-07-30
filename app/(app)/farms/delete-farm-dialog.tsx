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
import { useDeleteFarm } from "@/hooks/use-farms";
import type { Farm } from "@/types/farm";

type DeleteFarmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: Farm | null;
};

export function DeleteFarmDialog({
  open,
  onOpenChange,
  farm,
}: DeleteFarmDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteFarm = useDeleteFarm();

  async function handleConfirm() {
    if (!farm) return;
    setError(null);
    try {
      await deleteFarm.mutateAsync(farm.id);
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
          <DialogTitle>Fshi fermën</DialogTitle>
          <DialogDescription>
            Je i sigurt që dëshiron të fshish fermën{" "}
            <strong>{farm?.name}</strong>? Ky veprim nuk kthehet mbrapsht.
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
            loading={deleteFarm.isPending}
            onClick={handleConfirm}
          >
            Fshi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}