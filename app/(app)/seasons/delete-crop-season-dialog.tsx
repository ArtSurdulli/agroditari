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
import { useDeleteCropSeason } from "@/hooks/use-crop-seasons";
import type { CropSeason } from "@/types/crop-season";

type DeleteCropSeasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season: CropSeason | null;
};

export function DeleteCropSeasonDialog({
  open,
  onOpenChange,
  season,
}: DeleteCropSeasonDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteSeason = useDeleteCropSeason();

  async function handleConfirm() {
    if (!season) return;
    setError(null);
    try {
      await deleteSeason.mutateAsync(season.id);
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
          <DialogTitle>Fshi sezonin</DialogTitle>
          <DialogDescription>
            Je i sigurt që dëshiron të fshish sezonin{" "}
            <strong>
              {season?.cropName} — {season?.season}
            </strong>
            ? Ky veprim nuk kthehet mbrapsht.
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
            loading={deleteSeason.isPending}
            onClick={handleConfirm}
          >
            Fshi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}