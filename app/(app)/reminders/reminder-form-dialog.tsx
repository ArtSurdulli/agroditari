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
import { SelectLoadingItem } from "@/components/common/select-loading-item";
import { useCreateReminder, useUpdateReminder } from "@/hooks/use-reminders";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { entityAccentStyle, getEntityTheme } from "@/lib/entity-theme";
import type { ReminderInput } from "@/lib/validations/reminder";
import type { ApiError } from "@/lib/api/client";
import type { Reminder } from "@/types/reminder";

const NONE_SEASON_VALUE = "none";
const theme = getEntityTheme("reminders");

type ReminderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reminder: Reminder | null;
};

export function ReminderFormDialog({
  open,
  onOpenChange,
  reminder,
}: ReminderFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [cropSeasonId, setCropSeasonId] = useState(NONE_SEASON_VALUE);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Re-sync the form fields from `reminder` whenever the dialog transitions
  // to open — adjusted during render (React's recommended alternative to
  // resetting state in an effect) rather than one tick later.
  const [syncedOpen, setSyncedOpen] = useState(open);
  if (open !== syncedOpen) {
    setSyncedOpen(open);
    if (open) {
      setTitle(reminder?.title ?? "");
      setDescription(reminder?.description ?? "");
      setDueDate(reminder ? reminder.dueDate.slice(0, 10) : "");
      setCropSeasonId(reminder?.cropSeasonId ?? NONE_SEASON_VALUE);
      setIsDone(reminder?.isDone ?? false);
      setError(null);
      setFieldErrors({});
    }
  }

  const { data: seasons, isLoading: seasonsLoading } = useCropSeasons();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();

  const isEditing = !!reminder;
  const pending = createReminder.isPending || updateReminder.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload: Partial<ReminderInput> = {
      title,
      description,
      dueDate,
      cropSeasonId: cropSeasonId === NONE_SEASON_VALUE ? null : cropSeasonId,
    };
    if (isEditing) {
      payload.isDone = isDone;
    }

    try {
      if (reminder) {
        await updateReminder.mutateAsync({ id: reminder.id, ...payload });
      } else {
        await createReminder.mutateAsync(payload as ReminderInput);
      }
      onOpenChange(false);
      toast.success(isEditing ? "Kujtesa u ndryshua." : "Kujtesa u shtua.");
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
          entityKey="reminders"
          title={isEditing ? "Ndrysho kujtesën" : "Shto kujtesë"}
        />

        <form onSubmit={handleSubmit} className="space-y-6 px-1 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="reminder-title">Titulli</Label>
            <Input
              id="reminder-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="P.sh. Blej farëra"
            />
            {fieldErrors.title && (
              <p className="text-sm text-danger">{fieldErrors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reminder-description">Përshkrimi</Label>
            <Textarea
              id="reminder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Përshkrim shtesë (opsionale)"
              rows={3}
            />
            {fieldErrors.description && (
              <p className="text-sm text-danger">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reminder-due-date">Afati</Label>
            <Input
              id="reminder-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            {fieldErrors.dueDate && (
              <p className="text-sm text-danger">{fieldErrors.dueDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reminder-season">Sezoni</Label>
            <Select
              value={cropSeasonId}
              onValueChange={(value) =>
                setCropSeasonId(value ?? NONE_SEASON_VALUE)
              }
              items={[
                { value: NONE_SEASON_VALUE, label: "Asnjë" },
                ...(seasons?.map((season) => ({
                  value: season.id,
                  label: `${season.cropName} — ${season.parcelName} (${season.season})`,
                })) ?? []),
              ]}
            >
              <SelectTrigger id="reminder-season" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent entityKey="reminders">
                <SelectItem value={NONE_SEASON_VALUE}>Asnjë</SelectItem>
                {seasonsLoading ? (
                  <SelectLoadingItem />
                ) : (
                  seasons?.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.cropName} — {season.parcelName} ({season.season})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {fieldErrors.cropSeasonId && (
              <p className="text-sm text-danger">{fieldErrors.cropSeasonId}</p>
            )}
          </div>

          {isEditing && (
            <label
              htmlFor="reminder-is-done"
              className="flex items-center gap-2 text-sm font-medium text-text-primary"
            >
              <input
                id="reminder-is-done"
                type="checkbox"
                checked={isDone}
                onChange={(e) => setIsDone(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              E kryer
            </label>
          )}

          {error && <p className="mt-1 text-sm text-danger">{error}</p>}

          <DialogFooter>
            <LoadingButton
              type="submit"
              loading={pending}
              className="hover:opacity-90"
              style={{ backgroundColor: theme.color.solid }}
            >
              {isEditing ? "Ruaj ndryshimet" : "Shto kujtesën"}
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}