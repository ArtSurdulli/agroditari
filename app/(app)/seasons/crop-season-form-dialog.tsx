"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/common/loading-button";
import { SelectLoadingItem } from "@/components/common/select-loading-item";
import { EntityDialogHeader } from "@/components/common/entity-dialog-header";
import {
  useCreateCropSeason,
  useUpdateCropSeason,
} from "@/hooks/use-crop-seasons";
import { useParcels } from "@/hooks/use-parcels";
import { useCreateCrop, useCrops } from "@/hooks/use-crops";
import {
  seasonStatusLabels,
  seasonStatusValues,
} from "@/lib/validations/crop-season";
import { entityAccentStyle, getEntityTheme } from "@/lib/entity-theme";
import type { CropSeasonInput } from "@/lib/validations/crop-season";
import type { ApiError } from "@/lib/api/client";
import type { CropSeason } from "@/types/crop-season";

const theme = getEntityTheme("seasons");

type CropSeasonFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season: CropSeason | null;
};

export function CropSeasonFormDialog({
  open,
  onOpenChange,
  season,
}: CropSeasonFormDialogProps) {
  const [parcelId, setParcelId] = useState("");
  const [cropId, setCropId] = useState("");
  const [seasonLabel, setSeasonLabel] = useState("");
  const [status, setStatus] = useState("active");
  const [sowingDate, setSowingDate] = useState("");
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [addingCrop, setAddingCrop] = useState(false);
  const [newCropName, setNewCropName] = useState("");
  const [newCropError, setNewCropError] = useState<string | null>(null);

  // Re-sync the form fields from `season` whenever the dialog transitions to
  // open — adjusted during render (React's recommended alternative to
  // resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setParcelId(season?.parcelId ?? "");
      setCropId(season?.cropId ?? "");
      setSeasonLabel(season?.season ?? "");
      setStatus(season?.status ?? "active");
      setSowingDate(season?.sowingDate ? season.sowingDate.slice(0, 10) : "");
      setExpectedHarvestDate(
        season?.expectedHarvestDate
          ? season.expectedHarvestDate.slice(0, 10)
          : ""
      );
      setError(null);
      setFieldErrors({});
      setAddingCrop(false);
      setNewCropName("");
      setNewCropError(null);
    }
  }

  const { data: parcels, isLoading: parcelsLoading } = useParcels();
  const { data: crops, isLoading: cropsLoading } = useCrops();
  const createSeason = useCreateCropSeason();
  const updateSeason = useUpdateCropSeason();
  const createCrop = useCreateCrop();

  const isEditing = !!season;
  const pending = createSeason.isPending || updateSeason.isPending;

  const defaultCrops = crops?.filter((crop) => crop.isDefault) ?? [];
  const userCrops = crops?.filter((crop) => !crop.isDefault) ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      parcelId,
      cropId,
      season: seasonLabel,
      status: status as CropSeasonInput["status"],
      sowingDate,
      expectedHarvestDate,
    };

    try {
      if (season) {
        await updateSeason.mutateAsync({ id: season.id, ...payload });
      } else {
        await createSeason.mutateAsync(payload);
      }
      onOpenChange(false);
      toast.success(isEditing ? "Sezoni u ndryshua." : "Sezoni u shtua.");
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.details) {
        setFieldErrors(apiErr.details);
      } else {
        setError(apiErr.message || "Ndodhi një gabim. Provo përsëri.");
      }
    }
  }

  async function handleAddCrop(e: React.FormEvent) {
    e.preventDefault();
    setNewCropError(null);
    try {
      const crop = await createCrop.mutateAsync({ name: newCropName });
      setCropId(crop.id);
      setAddingCrop(false);
      setNewCropName("");
      toast.success("Kultura u shtua.");
    } catch (err) {
      const apiErr = err as ApiError;
      setNewCropError(apiErr.message || "Ndodhi një gabim. Provo përsëri.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={entityAccentStyle(theme)}>
        <EntityDialogHeader
          entityKey="seasons"
          title={isEditing ? "Ndrysho sezonin" : "Shto sezon"}
        />

        <form onSubmit={handleSubmit} className="space-y-6 px-1 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="season-parcel">Parcela</Label>
            <Select
              value={parcelId}
              onValueChange={(value) => setParcelId(value ?? "")}
              items={
                parcels?.map((parcel) => ({
                  value: parcel.id,
                  label: `${parcel.name} — ${parcel.farmName}`,
                })) ?? []
              }
            >
              <SelectTrigger id="season-parcel" className="w-full">
                <SelectValue placeholder="Zgjidh parcelën" />
              </SelectTrigger>
              <SelectContent entityKey="seasons">
                {parcelsLoading ? (
                  <SelectLoadingItem />
                ) : (
                  parcels?.map((parcel) => (
                    <SelectItem key={parcel.id} value={parcel.id}>
                      {parcel.name} — {parcel.farmName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {fieldErrors.parcelId && (
              <p className="text-sm text-danger">{fieldErrors.parcelId}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="season-crop">Kultura</Label>
            <Select
              value={cropId}
              onValueChange={(value) => setCropId(value ?? "")}
              items={
                crops?.map((crop) => ({ value: crop.id, label: crop.name })) ??
                []
              }
            >
              <SelectTrigger id="season-crop" className="w-full">
                <SelectValue placeholder="Zgjidh kulturën" />
              </SelectTrigger>
              <SelectContent entityKey="seasons">
                {cropsLoading && <SelectLoadingItem />}
                {defaultCrops.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Kulturat e AgroDitari-t</SelectLabel>
                    {defaultCrops.map((crop) => (
                      <SelectItem key={crop.id} value={crop.id}>
                        {crop.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {userCrops.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Të shtuara nga përdoruesit</SelectLabel>
                    {userCrops.map((crop) => (
                      <SelectItem key={crop.id} value={crop.id}>
                        {crop.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {fieldErrors.cropId && (
              <p className="text-sm text-danger">{fieldErrors.cropId}</p>
            )}

            {!addingCrop ? (
              <button
                type="button"
                onClick={() => setAddingCrop(true)}
                className="flex items-center gap-1 text-sm font-medium hover:underline"
                style={{ color: theme.color.solid }}
              >
                <Plus className="h-3.5 w-3.5" />
                Shto kulturë të re
              </button>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Input
                    value={newCropName}
                    onChange={(e) => setNewCropName(e.target.value)}
                    placeholder="Emri i kulturës"
                    autoFocus
                  />
                  {newCropError && (
                    <p className="mt-1 text-sm text-danger">{newCropError}</p>
                  )}
                </div>
                <LoadingButton
                  type="button"
                  size="sm"
                  loading={createCrop.isPending}
                  onClick={handleAddCrop}
                  className="hover:opacity-90"
                  style={{ backgroundColor: theme.color.solid }}
                >
                  Shto
                </LoadingButton>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Anulo shtimin e kulturës"
                  onClick={() => {
                    setAddingCrop(false);
                    setNewCropName("");
                    setNewCropError(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-2">
            <Label htmlFor="season-label">Sezoni</Label>
            <Input
              id="season-label"
              value={seasonLabel}
              onChange={(e) => setSeasonLabel(e.target.value)}
              required
              placeholder="P.sh. Pranverë 2026"
            />
            {fieldErrors.season && (
              <p className="text-sm text-danger">{fieldErrors.season}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="season-status">Statusi</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value ?? "active")}
              items={seasonStatusValues.map((value) => ({
                value,
                label: seasonStatusLabels[value],
              }))}
            >
              <SelectTrigger id="season-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent entityKey="seasons">
                {seasonStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {seasonStatusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.status && (
              <p className="text-sm text-danger">{fieldErrors.status}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="season-sowing">Data e mbjelljes</Label>
              <Input
                id="season-sowing"
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
              />
              {fieldErrors.sowingDate && (
                <p className="text-sm text-danger">{fieldErrors.sowingDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="season-harvest">Korrja e pritur</Label>
              <Input
                id="season-harvest"
                type="date"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
              />
              {fieldErrors.expectedHarvestDate && (
                <p className="text-sm text-danger">
                  {fieldErrors.expectedHarvestDate}
                </p>
              )}
            </div>
          </div>

          {error && <p className="mt-1 text-sm text-danger">{error}</p>}

          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={pending}
              className="hover:opacity-90"
              style={{ backgroundColor: theme.color.solid }}
            >
              {isEditing ? "Ruaj ndryshimet" : "Shto sezonin"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}