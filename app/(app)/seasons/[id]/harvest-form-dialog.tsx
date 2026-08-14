"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCreateHarvest, useUpdateHarvest } from "@/hooks/use-harvests";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { unitTypeLabels, unitTypeValues } from "@/lib/validations/harvest";
import type { HarvestInput } from "@/lib/validations/harvest";
import type { ApiError } from "@/lib/api/client";
import type { Harvest } from "@/types/harvest";

type HarvestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  harvest: Harvest | null;
  // When set, the season is fixed (opened from a season detail page) and no
  // season picker is shown. When omitted, the user picks from their seasons.
  lockedCropSeasonId?: string;
};

// Accepts Albanian-locale comma decimals ("0,12") as well as dots, same fix
// as parcels' areaHa and expenses.
function parseDecimal(value: string): number {
  return Number(value.replace(",", "."));
}

function formatComputedRevenue(quantity: number, unitPrice: number): string {
  return (quantity * unitPrice).toFixed(2);
}

export function HarvestFormDialog({
  open,
  onOpenChange,
  harvest,
  lockedCropSeasonId,
}: HarvestFormDialogProps) {
  const [cropSeasonId, setCropSeasonId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [unitPrice, setUnitPrice] = useState("");
  const [revenue, setRevenue] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Re-sync the form fields from `harvest` whenever the dialog transitions
  // to open — adjusted during render (React's recommended alternative to
  // resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setCropSeasonId(harvest?.cropSeasonId ?? lockedCropSeasonId ?? "");
      setQuantity(harvest?.quantity ?? "");
      setUnit(harvest?.unit ?? "kg");
      setUnitPrice(harvest?.unitPrice ?? "");
      setRevenue(harvest?.revenue ?? "");
      setDate(harvest ? harvest.date.slice(0, 10) : "");
      setError(null);
      setFieldErrors({});
    }
  }

  const { data: seasons } = useCropSeasons();
  const createHarvest = useCreateHarvest();
  const updateHarvest = useUpdateHarvest();

  const isEditing = !!harvest;
  const pending = createHarvest.isPending || updateHarvest.isPending;

  // Auto-compute revenue = quantity × unitPrice whenever both are filled;
  // stays editable afterwards, but recomputes on every quantity/price change.
  function recomputeRevenue(nextQuantity: string, nextUnitPrice: string) {
    if (nextQuantity.trim() === "" || nextUnitPrice.trim() === "") return;
    const q = parseDecimal(nextQuantity);
    const p = parseDecimal(nextUnitPrice);
    if (Number.isFinite(q) && Number.isFinite(p)) {
      setRevenue(formatComputedRevenue(q, p));
    }
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    recomputeRevenue(value, unitPrice);
  }

  function handleUnitPriceChange(value: string) {
    setUnitPrice(value);
    recomputeRevenue(quantity, value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      cropSeasonId: lockedCropSeasonId ?? cropSeasonId,
      quantity: parseDecimal(quantity),
      unit: unit as HarvestInput["unit"],
      unitPrice:
        unitPrice.trim() === "" ? undefined : parseDecimal(unitPrice),
      revenue: revenue.trim() === "" ? undefined : parseDecimal(revenue),
      date,
    };

    try {
      if (harvest) {
        await updateHarvest.mutateAsync({ id: harvest.id, ...payload });
      } else {
        await createHarvest.mutateAsync(payload);
      }
      onOpenChange(false);
      toast.success(isEditing ? "Korrja u ndryshua." : "Korrja u shtua.");
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Ndrysho korrjen" : "Shto korrje"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!lockedCropSeasonId && (
            <div className="space-y-1.5">
              <Label htmlFor="harvest-season">Sezoni</Label>
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
                <SelectTrigger id="harvest-season" className="w-full">
                  <SelectValue placeholder="Zgjidh sezonin" />
                </SelectTrigger>
                <SelectContent>
                  {seasons?.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.cropName} — {season.parcelName} (
                      {season.season})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.cropSeasonId && (
                <p className="text-sm text-danger">
                  {fieldErrors.cropSeasonId}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="harvest-quantity">Sasia</Label>
              <Input
                id="harvest-quantity"
                type="number"
                step="0.001"
                min="0"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                required
              />
              {fieldErrors.quantity && (
                <p className="text-sm text-danger">{fieldErrors.quantity}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="harvest-unit">Njësia</Label>
              <Select
                value={unit}
                onValueChange={(value) => setUnit(value ?? "kg")}
                items={unitTypeValues.map((value) => ({
                  value,
                  label: unitTypeLabels[value],
                }))}
              >
                <SelectTrigger id="harvest-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitTypeValues.map((value) => (
                    <SelectItem key={value} value={value}>
                      {unitTypeLabels[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.unit && (
                <p className="text-sm text-danger">{fieldErrors.unit}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="harvest-unit-price">Çmimi/njësi (€)</Label>
              <Input
                id="harvest-unit-price"
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
              <Label htmlFor="harvest-revenue">Të ardhurat (€)</Label>
              <Input
                id="harvest-revenue"
                type="number"
                step="0.01"
                min="0"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="Opsionale"
              />
              {fieldErrors.revenue && (
                <p className="text-sm text-danger">{fieldErrors.revenue}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="harvest-date">Data</Label>
            <Input
              id="harvest-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {fieldErrors.date && (
              <p className="text-sm text-danger">{fieldErrors.date}</p>
            )}
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <DialogFooter>
            <LoadingButton type="submit" loading={pending}>
              {isEditing ? "Ruaj ndryshimet" : "Shto korrjen"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}