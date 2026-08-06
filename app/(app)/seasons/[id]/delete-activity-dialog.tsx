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
import { useDeleteActivity } from "@/hooks/use-activities";
import { activityTypeLabels } from "@/lib/validations/activity";
import type { Activity } from "@/types/activity";

type DeleteActivityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
};

export function DeleteActivityDialog({
  open,
  onOpenChange,
  activity,
}: DeleteActivityDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteActivity = useDeleteActivity();

  async function handleConfirm() {
    if (!activity) return;
    setError(null);
    try {
      await deleteActivity.mutateAsync(activity.id);
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
          <DialogTitle>Fshi aktivitetin</DialogTitle>
          <DialogDescription>
            Je i sigurt që dëshiron të fshish aktivitetin{" "}
            <strong>
              {activity ? activityTypeLabels[activity.activityType] : ""}
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
            loading={deleteActivity.isPending}
            onClick={handleConfirm}
          >
            Fshi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}