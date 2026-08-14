"use client";

import { Suspense, useState } from "react";
import { Bell, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import {
  useDeleteReminder,
  useReminders,
  useToggleReminderDone,
} from "@/hooks/use-reminders";
import { useOpenOnFlag } from "@/hooks/use-open-on-flag";
import { ReminderFormDialog } from "./reminder-form-dialog";
import type { Reminder } from "@/types/reminder";

const DONE_FILTER_ALL = "all";
const DONE_FILTER_PENDING = "pending";
const DONE_FILTER_DONE = "done";

const doneFilterOptions = [
  { value: DONE_FILTER_ALL, label: "Të gjitha" },
  { value: DONE_FILTER_PENDING, label: "Pa kryer" },
  { value: DONE_FILTER_DONE, label: "Të kryera" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sq-AL");
}

// Local calendar date (not UTC) — matches how a farmer reads "today" on
// their device, compared against dueDate's UTC-midnight-serialized value
// (which slice(0, 10) already reduces to the plain calendar date it was
// entered as).
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type ReminderStatus = "overdue" | "today" | "upcoming" | "done";

function getReminderStatus(reminder: Reminder): ReminderStatus {
  if (reminder.isDone) return "done";
  const due = reminder.dueDate.slice(0, 10);
  const today = todayStr();
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "upcoming";
}

function seasonLabel(reminder: Reminder) {
  if (!reminder.cropSeasonId) return "pa sezon";
  return `${reminder.cropName} — ${reminder.parcelName} (${reminder.season})`;
}

function ReminderStatusBadge({ status }: { status: ReminderStatus }) {
  if (status === "overdue") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-danger-light px-2.5 py-1 text-xs font-medium text-danger">
        Vonuar
      </span>
    );
  }
  if (status === "today") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-primary-light px-2.5 py-1 text-xs font-medium text-primary">
        Sot
      </span>
    );
  }
  return null;
}

function ReminderTitle({ reminder }: { reminder: Reminder }) {
  if (reminder.isDone) {
    return (
      <span className="text-text-secondary line-through">
        {reminder.title}
      </span>
    );
  }
  return <>{reminder.title}</>;
}

export default function RemindersPage() {
  return (
    <Suspense>
      <RemindersPageContent />
    </Suspense>
  );
}

function RemindersPageContent() {
  const [doneFilter, setDoneFilter] = useState<string>(DONE_FILTER_ALL);

  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const {
    data: reminders,
    isLoading,
    isError,
    error,
  } = useReminders({
    done:
      doneFilter === DONE_FILTER_PENDING
        ? false
        : doneFilter === DONE_FILTER_DONE
          ? true
          : undefined,
  });
  const toggleDone = useToggleReminderDone();
  const deleteReminder = useDeleteReminder();

  // Quick-add ("+ Shto") deep link: /reminders?new=1 opens the create dialog
  // straight away.
  const [formOpen, setFormOpen] = useOpenOnFlag("new");

  const [editingReminder, setEditingReminder] = useState<Reminder | null>(
    null
  );
  const [deletingReminder, setDeletingReminder] = useState<Reminder | null>(
    null
  );

  const isFiltered = doneFilter !== DONE_FILTER_ALL;

  function openCreateForm() {
    setEditingReminder(null);
    setFormOpen(true);
  }

  function openEditForm(reminder: Reminder) {
    setEditingReminder(reminder);
    setFormOpen(true);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Kujtesa"
        subtitle="Mos harro detyrat e ardhshme të fermës."
        actions={
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Shto kujtesë
          </Button>
        }
      />

      <div className="mt-6 max-w-xs">
        <Select
          value={doneFilter}
          onValueChange={(value) => setDoneFilter(value ?? DONE_FILTER_ALL)}
          items={doneFilterOptions}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {doneFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Duke ngarkuar...</p>
        ) : isError ? (
          <p className="text-sm text-danger">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim. Provo përsëri."}
          </p>
        ) : !reminders || reminders.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={Bell}
              title="Nuk ka kujtesa për këtë filtër."
              description="Provo një filtër tjetër."
            />
          ) : (
            <EmptyState
              icon={Bell}
              title="Ende s'ka kujtesa."
              description="Shto kujtesën e parë për të filluar."
              action={
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4" />
                  Shto kujtesë
                </Button>
              }
            />
          )
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Titulli</TableHead>
                  <TableHead>Sezoni</TableHead>
                  <TableHead>Afati</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => {
                  const status = getReminderStatus(reminder);
                  return (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={reminder.isDone}
                          onChange={() =>
                            toggleDone.mutate({
                              id: reminder.id,
                              isDone: !reminder.isDone,
                            })
                          }
                          aria-label={`Shëno ${reminder.title} si ${reminder.isDone ? "pa kryer" : "e kryer"}`}
                          className="h-4 w-4 rounded border-border accent-primary"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <ReminderTitle reminder={reminder} />
                          <ReminderStatusBadge status={status} />
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {seasonLabel(reminder)}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {formatDate(reminder.dueDate)}
                      </TableCell>
                      <TableCell>
                        <RowActionsMenu
                          ariaLabel={`Veprime për ${reminder.title}`}
                          onEdit={() => openEditForm(reminder)}
                          onDelete={() => setDeletingReminder(reminder)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const status = getReminderStatus(reminder);
              return (
                <div key={reminder.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={reminder.isDone}
                    onChange={() =>
                      toggleDone.mutate({
                        id: reminder.id,
                        isDone: !reminder.isDone,
                      })
                    }
                    aria-label={`Shëno ${reminder.title} si ${reminder.isDone ? "pa kryer" : "e kryer"}`}
                    className="mt-4 h-4 w-4 shrink-0 rounded border-border accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <EntityCard
                      entityKey="reminders"
                      title={<ReminderTitle reminder={reminder} />}
                      subtitle={`${seasonLabel(reminder)} · ${formatDate(reminder.dueDate)}`}
                      right={
                        <div className="flex items-center gap-2">
                          <ReminderStatusBadge status={status} />
                          <RowActionsMenu
                            ariaLabel={`Veprime për ${reminder.title}`}
                            onEdit={() => openEditForm(reminder)}
                            onDelete={() => setDeletingReminder(reminder)}
                          />
                        </div>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReminderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        reminder={editingReminder}
      />
      <ConfirmDeleteDialog
        open={!!deletingReminder}
        onOpenChange={(open) => !open && setDeletingReminder(null)}
        title="Fshi kujtesën"
        description={
          <>
            Je i sigurt që dëshiron të fshish kujtesën{" "}
            <strong>{deletingReminder?.title}</strong>? Ky veprim nuk kthehet
            mbrapsht.
          </>
        }
        pending={deleteReminder.isPending}
        onConfirm={async () => {
          if (!deletingReminder) return;
          await deleteReminder.mutateAsync(deletingReminder.id);
        }}
      />
    </main>
  );
}