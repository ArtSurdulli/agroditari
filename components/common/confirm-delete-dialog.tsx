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

type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  pending: boolean;
  onConfirm: () => Promise<void>;
};

// Shared delete-confirmation dialog used by every entity. Owns its own error
// state so callers only need to supply what to show and a mutation to run.
export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  pending,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);

  // Clear a stale error whenever the dialog reopens for a (possibly
  // different) item — adjusted during render (React's recommended
  // alternative to resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setError(null);
    }
  }

  async function handleConfirm() {
    setError(null);
    try {
      await onConfirm();
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            loading={pending}
            onClick={handleConfirm}
          >
            Fshi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}