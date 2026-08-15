"use client";

import { useState } from "react";
import { Plus, ShoppingBasket } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
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
import { useDeleteHarvest, useHarvests } from "@/hooks/use-harvests";
import { useOpenOnFlag } from "@/hooks/use-open-on-flag";
import { unitTypeLabels } from "@/lib/validations/harvest";
import { HarvestFormDialog } from "./harvest-form-dialog";
import type { Harvest } from "@/types/harvest";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sq-AL");
}

function formatEuro(amount: number) {
  return `${amount.toLocaleString("sq-AL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function formatQuantity(value: number) {
  return value.toLocaleString("sq-AL", { maximumFractionDigits: 3 });
}

export function SeasonHarvests({ cropSeasonId }: { cropSeasonId: string }) {
  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const {
    data: harvests,
    isLoading,
    isError,
    error,
  } = useHarvests({ cropSeasonId });
  const deleteHarvest = useDeleteHarvest();

  // Quick-add ("+ Shto") deep link: /seasons/[id]?new=harvests opens the
  // create dialog straight away.
  const [formOpen, setFormOpen] = useOpenOnFlag("new", "harvests");

  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [deletingHarvest, setDeletingHarvest] = useState<Harvest | null>(
    null
  );

  // A season can (in theory) log harvests in mixed units, so the quantity
  // total is grouped by unit rather than naively summed across units.
  const quantityByUnit = (harvests ?? []).reduce<Record<string, number>>(
    (acc, harvest) => {
      acc[harvest.unit] = (acc[harvest.unit] ?? 0) + Number(harvest.quantity);
      return acc;
    },
    {}
  );
  const totalQuantityLabel = Object.entries(quantityByUnit)
    .map(
      ([unit, qty]) =>
        `${formatQuantity(qty)} ${unitTypeLabels[unit as keyof typeof unitTypeLabels]}`
    )
    .join(", ");
  const totalRevenue = (harvests ?? []).reduce(
    (sum, harvest) => sum + Number(harvest.revenue ?? 0),
    0
  );

  function openCreateForm() {
    setEditingHarvest(null);
    setFormOpen(true);
  }

  function openEditForm(harvest: Harvest) {
    setEditingHarvest(harvest);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Korrjet</h2>
        {harvests && harvests.length > 0 && (
          <Button onClick={openCreateForm} size="sm">
            <Plus className="h-4 w-4" />
            Shto korrje
          </Button>
        )}
      </div>

      {harvests && harvests.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
          <StatCard
            label="Sasia gjithsej"
            value={totalQuantityLabel || "—"}
            icon={ShoppingBasket}
          />
          <StatCard
            label="Të ardhurat gjithsej"
            value={formatEuro(totalRevenue)}
            icon={ShoppingBasket}
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Duke ngarkuar...</p>
        ) : isError ? (
          <p className="text-sm text-danger">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim. Provo përsëri."}
          </p>
        ) : !harvests || harvests.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="Ende s'ka korrje."
            description="Shto korrjen e parë për këtë sezon."
            action={
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                Shto korrje
              </Button>
            }
          />
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sasia</TableHead>
                  <TableHead>Të ardhurat</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {harvests.map((harvest) => (
                  <TableRow key={harvest.id}>
                    <TableCell className="font-medium text-text-primary">
                      {formatQuantity(Number(harvest.quantity))}{" "}
                      {unitTypeLabels[harvest.unit]}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {harvest.revenue
                        ? formatEuro(Number(harvest.revenue))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(harvest.date)}
                    </TableCell>
                    <TableCell>
                      <RowActionsMenu
                        ariaLabel={`Veprime për korrjen e ${formatDate(harvest.date)}`}
                        onEdit={() => openEditForm(harvest)}
                        onDelete={() => setDeletingHarvest(harvest)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {harvests.map((harvest) => (
              <EntityCard
                key={harvest.id}
                entityKey="harvests"
                title={`${formatQuantity(Number(harvest.quantity))} ${unitTypeLabels[harvest.unit]}`}
                subtitle={
                  harvest.revenue
                    ? `${formatDate(harvest.date)} · ${formatEuro(Number(harvest.revenue))}`
                    : formatDate(harvest.date)
                }
                right={
                  <RowActionsMenu
                    ariaLabel={`Veprime për korrjen e ${formatDate(harvest.date)}`}
                    onEdit={() => openEditForm(harvest)}
                    onDelete={() => setDeletingHarvest(harvest)}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      <HarvestFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        harvest={editingHarvest}
        lockedCropSeasonId={cropSeasonId}
      />
      <ConfirmDeleteDialog
        open={!!deletingHarvest}
        onOpenChange={(open) => !open && setDeletingHarvest(null)}
        title="Fshi korrjen"
        description={
          <>
            Je i sigurt që dëshiron të fshish korrjen{" "}
            <strong>
              {deletingHarvest
                ? `${formatQuantity(Number(deletingHarvest.quantity))} ${unitTypeLabels[deletingHarvest.unit]}`
                : ""}
            </strong>
            ? Ky veprim nuk kthehet mbrapsht.
          </>
        }
        pending={deleteHarvest.isPending}
        onConfirm={async () => {
          if (!deletingHarvest) return;
          await deleteHarvest.mutateAsync(deletingHarvest.id);
        }}
      />
    </div>
  );
}