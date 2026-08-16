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
import { useCreateParcel, useUpdateParcel } from "@/hooks/use-parcels";
import { useFarms } from "@/hooks/use-farms";
import { entityAccentStyle, getEntityTheme } from "@/lib/entity-theme";
import { parseLocaleDecimal } from "@/lib/decimal";
import type { ApiError } from "@/lib/api/client";
import type { Parcel } from "@/types/parcel";

const theme = getEntityTheme("parcels");

type ParcelFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parcel: Parcel | null;
};

export function ParcelFormDialog({
  open,
  onOpenChange,
  parcel,
}: ParcelFormDialogProps) {
  const [farmId, setFarmId] = useState("");
  const [name, setName] = useState("");
  const [areaHa, setAreaHa] = useState("");
  const [soilType, setSoilType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Re-sync the form fields from `parcel` whenever the dialog transitions to
  // open — adjusted during render (React's recommended alternative to
  // resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setFarmId(parcel?.farmId ?? "");
      setName(parcel?.name ?? "");
      setAreaHa(parcel ? String(parcel.areaHa) : "");
      setSoilType(parcel?.soilType ?? "");
      setError(null);
      setFieldErrors({});
    }
  }

  const { data: farms, isLoading: farmsLoading } = useFarms();
  const createParcel = useCreateParcel();
  const updateParcel = useUpdateParcel();

  const isEditing = !!parcel;
  const pending = createParcel.isPending || updateParcel.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    try {
      if (parcel) {
        await updateParcel.mutateAsync({
          id: parcel.id,
          farmId,
          name,
          areaHa: parseLocaleDecimal(areaHa),
          soilType,
        });
      } else {
        await createParcel.mutateAsync({
          farmId,
          name,
          areaHa: parseLocaleDecimal(areaHa),
          soilType,
        });
      }
      onOpenChange(false);
      toast.success(isEditing ? "Parcela u ndryshua." : "Parcela u shtua.");
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
          entityKey="parcels"
          title={isEditing ? "Ndrysho parcelën" : "Shto parcelë"}
        />

        <form onSubmit={handleSubmit} className="space-y-6 px-1 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="parcel-farm">Ferma</Label>
            <Select
              value={farmId}
              onValueChange={(value) => setFarmId(value ?? "")}
              items={
                farms?.map((farm) => ({ value: farm.id, label: farm.name })) ??
                []
              }
            >
              <SelectTrigger id="parcel-farm" className="w-full">
                <SelectValue placeholder="Zgjidh fermën" />
              </SelectTrigger>
              <SelectContent entityKey="parcels">
                {farmsLoading ? (
                  <SelectLoadingItem />
                ) : (
                  farms?.map((farm) => (
                    <SelectItem key={farm.id} value={farm.id}>
                      {farm.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {fieldErrors.farmId && (
              <p className="text-sm text-danger">{fieldErrors.farmId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parcel-name">Emri</Label>
            <Input
              id="parcel-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Parcela 1"
            />
            {fieldErrors.name && (
              <p className="text-sm text-danger">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parcel-area">Sipërfaqja (ha)</Label>
            <Input
              id="parcel-area"
              type="number"
              step="0.01"
              min="0"
              value={areaHa}
              onChange={(e) => setAreaHa(e.target.value)}
              required
              placeholder="1.5"
            />
            {fieldErrors.areaHa && (
              <p className="text-sm text-danger">{fieldErrors.areaHa}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="parcel-soil">Lloji i tokës</Label>
            <Input
              id="parcel-soil"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              placeholder="P.sh. Argjilore"
            />
            {fieldErrors.soilType && (
              <p className="text-sm text-danger">{fieldErrors.soilType}</p>
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
              {isEditing ? "Ruaj ndryshimet" : "Shto parcelën"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}