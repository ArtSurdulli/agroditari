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
import { useDeleteExpense } from "@/hooks/use-expenses";
import { expenseCategoryLabels } from "@/lib/validations/expense";
import type { Expense } from "@/types/expense";

type DeleteExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
};

export function DeleteExpenseDialog({
  open,
  onOpenChange,
  expense,
}: DeleteExpenseDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const deleteExpense = useDeleteExpense();

  async function handleConfirm() {
    if (!expense) return;
    setError(null);
    try {
      await deleteExpense.mutateAsync(expense.id);
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
          <DialogTitle>Fshi shpenzimin</DialogTitle>
          <DialogDescription>
            Je i sigurt që dëshiron të fshish shpenzimin{" "}
            <strong>
              {expense ? expenseCategoryLabels[expense.category] : ""}
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
            loading={deleteExpense.isPending}
            onClick={handleConfirm}
          >
            Fshi
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}