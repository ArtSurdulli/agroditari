"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/common/loading-button";
import { useCreateFarm, useUpdateFarm } from "@/hooks/use-farms";
import type { Farm } from "@/types/farm";

type FarmFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farm: Farm | null;
};

export function FarmFormDialog({
  open,
  onOpenChange,
  farm,
}: FarmFormDialogProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Re-sync the form fields from `farm` whenever the dialog transitions to
  // open — adjusted during render (React's recommended alternative to
  // resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setName(farm?.name ?? "");
      setLocation(farm?.location ?? "");
      setError(null);
    }
  }

  const createFarm = useCreateFarm();
  const updateFarm = useUpdateFarm();

  const isEditing = !!farm;
  const pending = createFarm.isPending || updateFarm.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (farm) {
        await updateFarm.mutateAsync({ id: farm.id, name, location });
      } else {
        await createFarm.mutateAsync({ name, location });
      }
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
          <DialogTitle>
            {isEditing ? "Ndrysho fermën" : "Shto fermë"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="farm-name">Emri</Label>
            <Input
              id="farm-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ferma ime"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="farm-location">Vendndodhja</Label>
            <Input
              id="farm-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="P.sh. Korçë"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <LoadingButton type="submit" loading={pending}>
              {isEditing ? "Ruaj ndryshimet" : "Shto fermën"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}