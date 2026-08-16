"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { EntityIconChip } from "@/components/common/entity-icon-chip";
import { EntityTableRow } from "@/components/common/entity-table-row";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { SelectLoadingItem } from "@/components/common/select-loading-item";
import { StatCard } from "@/components/common/stat-card";
import { buttonVariants } from "@/components/ui/button";
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
import { useHarvests } from "@/hooks/use-harvests";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { getEntityTheme } from "@/lib/entity-theme";
import { unitTypeLabels } from "@/lib/validations/harvest";
import type { Harvest } from "@/types/harvest";

const theme = getEntityTheme("harvests");
const ALL_SEASONS_VALUE = "all";

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

function seasonLabel(harvest: Harvest) {
  return `${harvest.cropName} — ${harvest.parcelName} (${harvest.season})`;
}

export default function HarvestsPage() {
  return (
    <Suspense>
      <HarvestsPageContent />
    </Suspense>
  );
}

function HarvestsPageContent() {
  const [seasonFilter, setSeasonFilter] = useState<string>(ALL_SEASONS_VALUE);

  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const { data: seasons, isLoading: seasonsLoading } = useCropSeasons();

  const {
    data: harvests,
    isLoading,
    isError,
    error,
  } = useHarvests({
    cropSeasonId:
      seasonFilter === ALL_SEASONS_VALUE ? undefined : seasonFilter,
  });

  const isFiltered = seasonFilter !== ALL_SEASONS_VALUE;

  // A season can (in theory) log harvests in mixed units, so the quantity
  // total is grouped by unit rather than naively summed across units.
  const quantityByUnit = (harvests ?? []).reduce<Record<string, number>>(
    (acc, harvest) => {
      acc[harvest.unit] = (acc[harvest.unit] ?? 0) + Number(harvest.quantity);
      return acc;
    },
    {}
  );
  const totalQuantityParts = Object.entries(quantityByUnit).map(
    ([unit, qty]) =>
      `${formatQuantity(qty)} ${unitTypeLabels[unit as keyof typeof unitTypeLabels]}`
  );
  const totalRevenue = (harvests ?? []).reduce(
    (sum, harvest) => sum + Number(harvest.revenue ?? 0),
    0
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Korrje"
        subtitle="Të gjitha korrjet e fermave të tua."
        actions={
          <Link
            href="/shto/korrje"
            className={buttonVariants({ className: "hover:opacity-90" })}
            style={{ backgroundColor: theme.color.solid }}
          >
            <Plus className="h-4 w-4" />
            Shto korrje
          </Link>
        }
      />

      <div className="mt-6 max-w-sm">
        <Select
          value={seasonFilter}
          onValueChange={(value) => setSeasonFilter(value ?? ALL_SEASONS_VALUE)}
          items={[
            { value: ALL_SEASONS_VALUE, label: "Të gjitha sezonet" },
            ...(seasons?.map((season) => ({
              value: season.id,
              label: `${season.cropName} — ${season.parcelName} (${season.season})`,
            })) ?? []),
          ]}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Të gjitha sezonet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SEASONS_VALUE}>Të gjitha sezonet</SelectItem>
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
      </div>

      {harvests && harvests.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
          <StatCard
            label="Sasia gjithsej"
            value={totalQuantityParts.length > 0 ? totalQuantityParts : "—"}
            icon={theme.icon}
            color={theme.color}
            compact
          />
          <StatCard
            label="Të ardhurat gjithsej"
            value={formatEuro(totalRevenue)}
            icon={theme.icon}
            color={theme.color}
            compact
          />
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <ListSkeleton columns={4} />
        ) : isError ? (
          <p className="text-sm text-danger">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim. Provo përsëri."}
          </p>
        ) : !harvests || harvests.length === 0 ? (
          isFiltered ? (
            <EmptyState
              entityKey="harvests"
              title="Nuk u gjet asnjë korrje."
              description="Provo një sezon tjetër."
            />
          ) : (
            <EmptyState
              entityKey="harvests"
              title="Ende s'ka korrje."
              description="Shto korrjen tënde të parë për të filluar."
              action={
                <Link
                  href="/shto/korrje"
                  className={buttonVariants({ className: "hover:opacity-90" })}
                  style={{ backgroundColor: theme.color.solid }}
                >
                  <Plus className="h-4 w-4" />
                  Shto korrje
                </Link>
              }
            />
          )
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sasia</TableHead>
                  <TableHead>Sezoni</TableHead>
                  <TableHead>Të ardhurat</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {harvests.map((harvest) => (
                  <EntityTableRow key={harvest.id} entityKey="harvests">
                    <TableCell className="font-medium text-text-primary">
                      <div className="flex items-center gap-3">
                        <EntityIconChip entityKey="harvests" />
                        {formatQuantity(Number(harvest.quantity))}{" "}
                        {unitTypeLabels[harvest.unit]}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/seasons/${harvest.cropSeasonId}`}
                        className="hover:underline"
                        style={{ color: theme.color.solid }}
                      >
                        {seasonLabel(harvest)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {harvest.revenue
                        ? formatEuro(Number(harvest.revenue))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(harvest.date)}
                    </TableCell>
                  </EntityTableRow>
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
                href={`/seasons/${harvest.cropSeasonId}`}
                title={`${formatQuantity(Number(harvest.quantity))} ${unitTypeLabels[harvest.unit]}`}
                subtitle={`${seasonLabel(harvest)} · ${formatDate(harvest.date)}`}
                right={
                  harvest.revenue ? (
                    <span
                      className="text-sm font-semibold"
                      style={{ color: theme.color.textStrong }}
                    >
                      {formatEuro(Number(harvest.revenue))}
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
