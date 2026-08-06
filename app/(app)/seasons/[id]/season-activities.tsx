"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MoreVertical, Notebook, Plus } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { useActivities } from "@/hooks/use-activities";
import { activityTypeLabels } from "@/lib/validations/activity";
import { ActivityFormDialog } from "./activity-form-dialog";
import { DeleteActivityDialog } from "./delete-activity-dialog";
import type { Activity } from "@/types/activity";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sq-AL");
}

export function SeasonActivities({
  cropSeasonId,
  autoOpenCreate = false,
}: {
  cropSeasonId: string;
  // Set when arriving via the global quick-add flow (?new=activities) — opens
  // the create dialog immediately instead of requiring another tap.
  autoOpenCreate?: boolean;
}) {
  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const {
    data: activities,
    isLoading,
    isError,
    error,
  } = useActivities({ cropSeasonId });

  // Seeded from autoOpenCreate so a fresh navigation opens it immediately;
  // the sync check below (adjusted during render, same pattern as the
  // dialogs' syncedOpen — an effect body must not call setState
  // synchronously) then also catches the prop turning true on an
  // already-mounted instance (e.g. re-visiting this season with a different
  // ?new= value).
  const router = useRouter();
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(autoOpenCreate);
  const [syncedAutoOpen, setSyncedAutoOpen] = useState(autoOpenCreate);
  if (autoOpenCreate !== syncedAutoOpen) {
    setSyncedAutoOpen(autoOpenCreate);
    if (autoOpenCreate) {
      setFormOpen(true);
    }
  }

  useEffect(() => {
    if (autoOpenCreate) {
      router.replace(pathname);
    }
  }, [autoOpenCreate, pathname, router]);

  const [editingActivity, setEditingActivity] = useState<Activity | null>(
    null
  );
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(
    null
  );

  function openCreateForm() {
    setEditingActivity(null);
    setFormOpen(true);
  }

  function openEditForm(activity: Activity) {
    setEditingActivity(activity);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Aktivitetet
        </h2>
        {activities && activities.length > 0 && (
          <Button onClick={openCreateForm} size="sm">
            <Plus className="h-4 w-4" />
            Shto aktivitet
          </Button>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Duke ngarkuar...</p>
        ) : isError ? (
          <p className="text-sm text-danger">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim. Provo përsëri."}
          </p>
        ) : !activities || activities.length === 0 ? (
          <EmptyState
            icon={Notebook}
            title="Ende s'ka aktivitete."
            description="Shto aktivitetin e parë për këtë sezon."
            action={
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                Shto aktivitet
              </Button>
            }
          />
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lloji</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Shënime</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell className="font-medium text-text-primary">
                      {activityTypeLabels[activity.activityType]}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(activity.date)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-text-secondary">
                      {activity.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <ActivityRowActions
                        activity={activity}
                        onEdit={() => openEditForm(activity)}
                        onDelete={() => setDeletingActivity(activity)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <EntityCard
                key={activity.id}
                entityKey="activities"
                title={activityTypeLabels[activity.activityType]}
                subtitle={
                  activity.notes
                    ? `${formatDate(activity.date)} · ${activity.notes}`
                    : formatDate(activity.date)
                }
                right={
                  <ActivityRowActions
                    activity={activity}
                    onEdit={() => openEditForm(activity)}
                    onDelete={() => setDeletingActivity(activity)}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={editingActivity}
        lockedCropSeasonId={cropSeasonId}
      />
      <DeleteActivityDialog
        open={!!deletingActivity}
        onOpenChange={(open) => !open && setDeletingActivity(null)}
        activity={deletingActivity}
      />
    </div>
  );
}

function ActivityRowActions({
  activity,
  onEdit,
  onDelete,
}: {
  activity: Activity;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Veprime për aktivitetin ${activityTypeLabels[activity.activityType]}`}
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Ndrysho</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          Fshi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}