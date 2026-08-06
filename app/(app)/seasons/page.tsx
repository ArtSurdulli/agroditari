"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MoreVertical, Plus, Search, Sprout } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { useParcels } from "@/hooks/use-parcels";
import { entityTheme } from "@/lib/entity-theme";
import { seasonStatusValues, seasonStatusLabels } from "@/lib/validations/crop-season";
import { CropSeasonFormDialog } from "./crop-season-form-dialog";
import { DeleteCropSeasonDialog } from "./delete-crop-season-dialog";
import type { CropSeason } from "@/types/crop-season";

const ALL_PARCELS_VALUE = "all";
const ALL_STATUS_VALUE = "all";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("sq-AL");
}

function StatusBadge({ status }: { status: CropSeason["status"] }) {
  const { badgeBg, textStrong } = entityTheme.seasons.color;
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: badgeBg, color: textStrong }}
    >
      {seasonStatusLabels[status]}
    </span>
  );
}

export default function CropSeasonsPage() {
  return (
    <Suspense>
      <CropSeasonsPageContent />
    </Suspense>
  );
}

function CropSeasonsPageContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [parcelFilter, setParcelFilter] = useState<string>(ALL_PARCELS_VALUE);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS_VALUE);

  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const { data: parcels } = useParcels();

  const {
    data: seasons,
    isLoading,
    isError,
    error,
  } = useCropSeasons({
    q: debouncedSearch,
    parcelId: parcelFilter === ALL_PARCELS_VALUE ? undefined : parcelFilter,
    status: statusFilter === ALL_STATUS_VALUE ? undefined : statusFilter,
  });

  // Quick-add ("+ Shto") deep link: /seasons?new=1 opens the create dialog
  // straight away. useSearchParams() (not a one-time window.location read) is
  // what makes this fire even when this page was already mounted (e.g. the
  // client router reused it from an earlier visit) — a plain useState
  // initializer only runs once per component instance and would miss that.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const newFlag = searchParams.get("new") === "1";

  // Seeded from newFlag so a fresh navigation opens it immediately; the sync
  // check below (adjusted during render, same pattern as the dialogs'
  // syncedOpen — an effect body must not call setState synchronously) then
  // also catches the flag reappearing on an already-mounted instance.
  const [formOpen, setFormOpen] = useState(newFlag);
  const [syncedNewFlag, setSyncedNewFlag] = useState(newFlag);
  if (newFlag !== syncedNewFlag) {
    setSyncedNewFlag(newFlag);
    if (newFlag) {
      setFormOpen(true);
    }
  }

  useEffect(() => {
    if (newFlag) {
      router.replace(pathname);
    }
  }, [newFlag, pathname, router]);

  const [editingSeason, setEditingSeason] = useState<CropSeason | null>(null);
  const [deletingSeason, setDeletingSeason] = useState<CropSeason | null>(
    null
  );

  const isFiltered =
    !!debouncedSearch ||
    parcelFilter !== ALL_PARCELS_VALUE ||
    statusFilter !== ALL_STATUS_VALUE;

  function openCreateForm() {
    setEditingSeason(null);
    setFormOpen(true);
  }

  function openEditForm(season: CropSeason) {
    setEditingSeason(season);
    setFormOpen(true);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Sezonet"
        subtitle="Menaxho sezonet e kulturave në parcelat e tua."
        actions={
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Shto sezon
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko sezone..."
            className="pl-9"
          />
        </div>

        <Select
          value={parcelFilter}
          onValueChange={(value) => setParcelFilter(value ?? ALL_PARCELS_VALUE)}
          items={[
            { value: ALL_PARCELS_VALUE, label: "Të gjitha parcelat" },
            ...(parcels?.map((parcel) => ({
              value: parcel.id,
              label: `${parcel.name} — ${parcel.farmName}`,
            })) ?? []),
          ]}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Të gjitha parcelat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PARCELS_VALUE}>
              Të gjitha parcelat
            </SelectItem>
            {parcels?.map((parcel) => (
              <SelectItem key={parcel.id} value={parcel.id}>
                {parcel.name} — {parcel.farmName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value ?? ALL_STATUS_VALUE)}
          items={[
            { value: ALL_STATUS_VALUE, label: "Të gjitha statuset" },
            ...seasonStatusValues.map((status) => ({
              value: status,
              label: seasonStatusLabels[status],
            })),
          ]}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Të gjitha statuset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS_VALUE}>
              Të gjitha statuset
            </SelectItem>
            {seasonStatusValues.map((status) => (
              <SelectItem key={status} value={status}>
                {seasonStatusLabels[status]}
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
        ) : !seasons || seasons.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={Search}
              title="Nuk u gjet asnjë sezon."
              description="Provo një kërkim tjetër."
            />
          ) : (
            <EmptyState
              icon={Sprout}
              title="Ende s'ka sezone."
              description="Shto sezonin e parë të kulturës për të filluar."
              action={
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4" />
                  Shto sezon
                </Button>
              }
            />
          )
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kultura</TableHead>
                  <TableHead>Sezoni</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Ferma</TableHead>
                  <TableHead>Statusi</TableHead>
                  <TableHead>Mbjellja</TableHead>
                  <TableHead>Korrja e pritur</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => (
                  <TableRow key={season.id}>
                    <TableCell className="font-medium text-text-primary">
                      {season.cropName}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/seasons/${season.id}`}
                        className="font-medium hover:underline"
                        style={{ color: entityTheme.seasons.color.solid }}
                      >
                        {season.season}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {season.parcelName}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {season.farmName}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={season.status} />
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(season.sowingDate)}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(season.expectedHarvestDate)}
                    </TableCell>
                    <TableCell>
                      <CropSeasonRowActions
                        season={season}
                        onEdit={() => openEditForm(season)}
                        onDelete={() => setDeletingSeason(season)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {seasons.map((season) => (
              <EntityCard
                key={season.id}
                entityKey="seasons"
                href={`/seasons/${season.id}`}
                title={`${season.cropName} · ${season.season}`}
                subtitle={`${season.parcelName} — ${season.farmName}`}
                badge={seasonStatusLabels[season.status]}
                right={
                  <CropSeasonRowActions
                    season={season}
                    onEdit={() => openEditForm(season)}
                    onDelete={() => setDeletingSeason(season)}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      <CropSeasonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        season={editingSeason}
      />
      <DeleteCropSeasonDialog
        open={!!deletingSeason}
        onOpenChange={(open) => !open && setDeletingSeason(null)}
        season={deletingSeason}
      />
    </main>
  );
}

function CropSeasonRowActions({
  season,
  onEdit,
  onDelete,
}: {
  season: CropSeason;
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
            aria-label={`Veprime për ${season.season}`}
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href={`/seasons/${season.id}`} />}>
          Shiko sezonin
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>Ndrysho</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          Fshi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}