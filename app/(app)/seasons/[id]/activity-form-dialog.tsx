"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingButton } from "@/components/common/loading-button";
import { EntityDialogHeader } from "@/components/common/entity-dialog-header";
import { useCreateActivity, useUpdateActivity } from "@/hooks/use-activities";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import {
  activityTypeLabels,
  activityTypeValues,
} from "@/lib/validations/activity";
import { getEntityTheme } from "@/lib/entity-theme";
import type { ActivityInput } from "@/lib/validations/activity";
import type { ApiError } from "@/lib/api/client";
import type { Activity } from "@/types/activity";

const theme = getEntityTheme("activities");

type ActivityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  // When set, the season is fixed (opened from a season detail page) and no
  // season picker is shown. When omitted, the user picks from their seasons.
  lockedCropSeasonId?: string;
};

export function ActivityFormDialog({
  open,
  onOpenChange,
  activity,
  lockedCropSeasonId,
}: ActivityFormDialogProps) {
  const [cropSeasonId, setCropSeasonId] = useState("");
  const [activityType, setActivityType] = useState("sowing");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Re-sync the form fields from `activity` whenever the dialog transitions
  // to open — adjusted during render (React's recommended alternative to
  // resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setCropSeasonId(activity?.cropSeasonId ?? lockedCropSeasonId ?? "");
      setActivityType(activity?.activityType ?? "sowing");
      setDate(activity ? activity.date.slice(0, 10) : "");
      setNotes(activity?.notes ?? "");
      setError(null);
      setFieldErrors({});
    }
  }

  const { data: seasons } = useCropSeasons();
  const createActivity = useCreateActivity();
  const updateActivity = useUpdateActivity();

  const isEditing = !!activity;
  const pending = createActivity.isPending || updateActivity.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      cropSeasonId: lockedCropSeasonId ?? cropSeasonId,
      activityType: activityType as ActivityInput["activityType"],
      date,
      notes,
    };

    try {
      if (activity) {
        await updateActivity.mutateAsync({ id: activity.id, ...payload });
      } else {
        await createActivity.mutateAsync(payload);
      }
      onOpenChange(false);
      toast.success(
        isEditing ? "Aktiviteti u ndryshua." : "Aktiviteti u shtua."
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
      <DialogContent>
        <EntityDialogHeader
          entityKey="activities"
          title={isEditing ? "Ndrysho aktivitetin" : "Shto aktivitet"}
        />

        <form onSubmit={handleSubmit} className="space-y-6 px-1 pt-1">
          {!lockedCropSeasonId && (
            <div className="space-y-1.5">
              <Label htmlFor="activity-season">Sezoni</Label>
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
                <SelectTrigger id="activity-season" className="w-full">
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

          <div className="space-y-1.5">
            <Label htmlFor="activity-type">Lloji i aktivitetit</Label>
            <Select
              value={activityType}
              onValueChange={(value) => setActivityType(value ?? "sowing")}
              items={activityTypeValues.map((value) => ({
                value,
                label: activityTypeLabels[value],
              }))}
            >
              <SelectTrigger id="activity-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {activityTypeLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.activityType && (
              <p className="text-sm text-danger">
                {fieldErrors.activityType}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activity-date">Data</Label>
            <Input
              id="activity-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {fieldErrors.date && (
              <p className="text-sm text-danger">{fieldErrors.date}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activity-notes">Shënime</Label>
            <Textarea
              id="activity-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Shënime shtesë (opsionale)"
              rows={3}
            />
            {fieldErrors.notes && (
              <p className="text-sm text-danger">{fieldErrors.notes}</p>
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
              {isEditing ? "Ruaj ndryshimet" : "Shto aktivitetin"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}