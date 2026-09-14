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
import { useAdminSession } from "@/components/admin/admin-context";
import { useCreateCrop } from "@/hooks/use-crops";
import { useUpdateCrop } from "@/hooks/use-admin";
import { getAdminRoleTheme } from "@/lib/admin-theme";
import { unitTypeLabels } from "@/lib/validations/harvest";
import { unitTypeValues } from "@/lib/validations/crop";
import type { ApiError } from "@/lib/api/client";
import type { Crop } from "@/types/crop";

type CropFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crop: Crop | null;
};

// Global crop catalog editor — admin/superadmin only. Creation reuses the
// same POST /api/crops a farmer's quick-add already calls (crops are global,
// nothing ownership-specific about adding one); editing/removing an
// existing crop is admin-only (app/api/admin/crops/[id]/route.ts).
export function CropFormDialog({ open, onOpenChange, crop }: CropFormDialogProps) {
  const { role } = useAdminSession();
  const theme = getAdminRoleTheme(role);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [standardUnit, setStandardUnit] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setName(crop?.name ?? "");
      setCategory(crop?.category ?? "");
      setStandardUnit(crop?.standardUnit ?? "");
      setError(null);
      setFieldErrors({});
    }
  }

  const createCrop = useCreateCrop();
  const updateCrop = useUpdateCrop();
  const isEditing = !!crop;
  const pending = createCrop.isPending || updateCrop.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const input = {
      name,
      category: category || undefined,
      standardUnit: (standardUnit || undefined) as
        | (typeof unitTypeValues)[number]
        | undefined,
    };

    try {
      if (crop) {
        await updateCrop.mutateAsync({ id: crop.id, ...input });
      } else {
        await createCrop.mutateAsync(input);
      }
      onOpenChange(false);
      toast.success(isEditing ? "Kultura u ndryshua." : "Kultura u shtua.");
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
      <DialogContent style={{ "--entity-accent": theme.color.border } as React.CSSProperties}>
        <DialogHeader
          className="-mx-4 -mt-4 rounded-t-xl px-4 py-4"
          style={{ backgroundColor: theme.color.tint }}
        >
          <DialogTitle style={{ color: theme.color.textStrong }}>
            {isEditing ? "Ndrysho kulturën" : "Shto kulturë"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-1 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="crop-name">Emri</Label>
            <Input
              id="crop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="P.sh. Domate"
            />
            {fieldErrors.name && (
              <p className="text-sm text-danger">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="crop-category">Kategoria</Label>
            <Input
              id="crop-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="P.sh. Perime"
            />
            {fieldErrors.category && (
              <p className="text-sm text-danger">{fieldErrors.category}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="crop-unit">Njësia standarde</Label>
            <Select
              value={standardUnit}
              onValueChange={(value) => setStandardUnit(value ?? "")}
              items={unitTypeValues.map((value) => ({
                value,
                label: unitTypeLabels[value],
              }))}
            >
              <SelectTrigger id="crop-unit" className="w-full">
                <SelectValue placeholder="Zgjidh njësinë" />
              </SelectTrigger>
              <SelectContent>
                {unitTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {unitTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.standardUnit && (
              <p className="text-sm text-danger">{fieldErrors.standardUnit}</p>
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
              {isEditing ? "Ruaj ndryshimet" : "Shto kulturën"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
