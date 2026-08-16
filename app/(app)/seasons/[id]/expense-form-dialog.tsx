"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/components/common/loading-button";
import { EntityDialogHeader } from "@/components/common/entity-dialog-header";
import { SelectLoadingItem } from "@/components/common/select-loading-item";
import { useCreateExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import {
  expenseCategoryLabels,
  expenseCategoryValues,
} from "@/lib/validations/expense";
import { entityAccentStyle, getEntityTheme } from "@/lib/entity-theme";
import { parseLocaleDecimal } from "@/lib/decimal";
import type { ExpenseInput } from "@/lib/validations/expense";
import type { ApiError } from "@/lib/api/client";
import type { Expense } from "@/types/expense";

const theme = getEntityTheme("expenses");

type ExpenseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  // When set, the season is fixed (opened from a season detail page) and no
  // season picker is shown. When omitted, the user picks from their seasons.
  lockedCropSeasonId?: string;
};

function formatComputedAmount(quantity: number, unitPrice: number): string {
  return (quantity * unitPrice).toFixed(2);
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  lockedCropSeasonId,
}: ExpenseFormDialogProps) {
  const [cropSeasonId, setCropSeasonId] = useState("");
  const [category, setCategory] = useState("inputs");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Re-sync the form fields from `expense` whenever the dialog transitions
  // to open — adjusted during render (React's recommended alternative to
  // resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setCropSeasonId(expense?.cropSeasonId ?? lockedCropSeasonId ?? "");
      setCategory(expense?.category ?? "inputs");
      setDescription(expense?.description ?? "");
      setQuantity(expense?.quantity ?? "");
      setUnitPrice(expense?.unitPrice ?? "");
      setAmount(expense ? String(expense.amount) : "");
      setDate(expense ? expense.date.slice(0, 10) : "");
      setError(null);
      setFieldErrors({});
    }
  }

  const { data: seasons, isLoading: seasonsLoading } = useCropSeasons();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();

  const isEditing = !!expense;
  const pending = createExpense.isPending || updateExpense.isPending;

  // Auto-compute amount = quantity × unitPrice whenever both are filled;
  // stays editable afterwards, but recomputes on every quantity/price change.
  function recomputeAmount(nextQuantity: string, nextUnitPrice: string) {
    if (nextQuantity.trim() === "" || nextUnitPrice.trim() === "") return;
    const q = parseLocaleDecimal(nextQuantity);
    const p = parseLocaleDecimal(nextUnitPrice);
    if (Number.isFinite(q) && Number.isFinite(p)) {
      setAmount(formatComputedAmount(q, p));
    }
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    recomputeAmount(value, unitPrice);
  }

  function handleUnitPriceChange(value: string) {
    setUnitPrice(value);
    recomputeAmount(quantity, value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      cropSeasonId: lockedCropSeasonId ?? cropSeasonId,
      category: category as ExpenseInput["category"],
      description,
      quantity:
        quantity.trim() === "" ? undefined : parseLocaleDecimal(quantity),
      unitPrice:
        unitPrice.trim() === "" ? undefined : parseLocaleDecimal(unitPrice),
      amount: parseLocaleDecimal(amount),
      date,
    };

    try {
      if (expense) {
        await updateExpense.mutateAsync({ id: expense.id, ...payload });
      } else {
        await createExpense.mutateAsync(payload);
      }
      onOpenChange(false);
      toast.success(
        isEditing ? "Shpenzimi u ndryshua." : "Shpenzimi u shtua."
      );
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.details) {
        setFieldErrors(apiErr.details);
      } else {
        setError(apiErr.message || "Ndodhi një gabim. Provo përsëri.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={entityAccentStyle(theme)}>
        <EntityDialogHeader
          entityKey="expenses"
          title={isEditing ? "Ndrysho shpenzimin" : "Shto shpenzim"}
        />

        <form onSubmit={handleSubmit} className="space-y-6 px-1 pt-1">
          {!lockedCropSeasonId && (
            <div className="space-y-1.5">
              <Label htmlFor="expense-season">Sezoni</Label>
              <Select
                value={cropSeasonId}
                onValueChange={(value) => setCropSeasonId(value ?? "")}
                items={
                  seasons?.map((season) => ({
                    value: season.id,
                    label: `${season.cropName} — ${season.parcelName} (${season.season})`,
                  })) ?? []
                }
              >
                <SelectTrigger id="expense-season" className="w-full">
                  <SelectValue placeholder="Zgjidh sezonin" />
                </SelectTrigger>
                <SelectContent entityKey="expenses">
                  {seasonsLoading ? (
                    <SelectLoadingItem />
                  ) : (
                    seasons?.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.cropName} — {season.parcelName} (
                        {season.season})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {fieldErrors.cropSeasonId && (
                <p className="text-sm text-danger">
                  {fieldErrors.cropSeasonId}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="expense-category">Kategoria</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value ?? "inputs")}
              items={expenseCategoryValues.map((value) => ({
                value,
                label: expenseCategoryLabels[value],
              }))}
            >
              <SelectTrigger id="expense-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent entityKey="expenses">
                {expenseCategoryValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {expenseCategoryLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.category && (
              <p className="text-sm text-danger">{fieldErrors.category}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-description">Përshkrimi</Label>
            <Input
              id="expense-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="P.sh. Plehra kimike"
            />
            {fieldErrors.description && (
              <p className="text-sm text-danger">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="expense-quantity">Sasia</Label>
              <Input
                id="expense-quantity"
                type="number"
                step="0.001"
                min="0"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                placeholder="Opsionale"
              />
              {fieldErrors.quantity && (
                <p className="text-sm text-danger">{fieldErrors.quantity}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-unit-price">Çmimi/njësi (€)</Label>
              <Input
                id="expense-unit-price"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                placeholder="Opsionale"
              />
              {fieldErrors.unitPrice && (
                <p className="text-sm text-danger">{fieldErrors.unitPrice}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense-amount">Shuma (€)</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
              />
              {fieldErrors.amount && (
                <p className="text-sm text-danger">{fieldErrors.amount}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-date">Data</Label>
            <Input
              id="expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {fieldErrors.date && (
              <p className="text-sm text-danger">{fieldErrors.date}</p>
            )}
          </div>

          {error && <p className="mt-1 text-sm text-danger">{error}</p>}

          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={pending}
              className="hover:opacity-90"
              style={{ backgroundColor: theme.color.solid }}
            >
              {isEditing ? "Ruaj ndryshimet" : "Shto shpenzimin"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}