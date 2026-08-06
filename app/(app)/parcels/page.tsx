"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Map, MoreVertical, Plus, Search } from "lucide-react";
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
import { useParcels } from "@/hooks/use-parcels";
import { useFarms } from "@/hooks/use-farms";
import { ParcelFormDialog } from "./parcel-form-dialog";
import { DeleteParcelDialog } from "./delete-parcel-dialog";
import type { Parcel } from "@/types/parcel";

const ALL_FARMS_VALUE = "all";

function formatArea(areaHa: string) {
  const value = Number(areaHa);
  return Number.isFinite(value) ? value.toLocaleString("sq-AL") : areaHa;
}

export default function ParcelsPage() {
  return (
    <Suspense>
      <ParcelsPageContent />
    </Suspense>
  );
}

function ParcelsPageContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [farmFilter, setFarmFilter] = useState<string>(ALL_FARMS_VALUE);

  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const { data: farms } = useFarms();

  const {
    data: parcels,
    isLoading,
    isError,
    error,
  } = useParcels({
    q: debouncedSearch,
    farmId: farmFilter === ALL_FARMS_VALUE ? undefined : farmFilter,
  });

  // Quick-add ("+ Shto") deep link: /parcels?new=1 opens the create dialog
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

  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null);
  const [deletingParcel, setDeletingParcel] = useState<Parcel | null>(null);

  const isFiltered = !!debouncedSearch || farmFilter !== ALL_FARMS_VALUE;

  function openCreateForm() {
    setEditingParcel(null);
    setFormOpen(true);
  }

  function openEditForm(parcel: Parcel) {
    setEditingParcel(parcel);
    setFormOpen(true);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Parcelat"
        subtitle="Menaxho parcelat e fermave të tua."
        actions={
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Shto parcelë
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko parcela..."
            className="pl-9"
          />
        </div>

        <Select
          value={farmFilter}
          onValueChange={(value) => setFarmFilter(value ?? ALL_FARMS_VALUE)}
          items={[
            { value: ALL_FARMS_VALUE, label: "Të gjitha fermat" },
            ...(farms?.map((farm) => ({ value: farm.id, label: farm.name })) ??
              []),
          ]}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Të gjitha fermat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_FARMS_VALUE}>Të gjitha fermat</SelectItem>
            {farms?.map((farm) => (
              <SelectItem key={farm.id} value={farm.id}>
                {farm.name}
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
        ) : !parcels || parcels.length === 0 ? (
          isFiltered ? (
            <EmptyState
              icon={Search}
              title="Nuk u gjet asnjë parcelë."
              description="Provo një kërkim tjetër."
            />
          ) : (
            <EmptyState
              icon={Map}
              title="Ende s'ka parcela."
              description="Shto parcelën tënde të parë për të filluar."
              action={
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4" />
                  Shto parcelë
                </Button>
              }
            />
          )
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emri</TableHead>
                  <TableHead>Ferma</TableHead>
                  <TableHead>Sipërfaqja (ha)</TableHead>
                  <TableHead>Lloji i tokës</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcels.map((parcel) => (
                  <TableRow key={parcel.id}>
                    <TableCell className="font-medium text-text-primary">
                      {parcel.name}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {parcel.farmName}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatArea(parcel.areaHa)}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {parcel.soilType || "—"}
                    </TableCell>
                    <TableCell>
                      <ParcelRowActions
                        parcel={parcel}
                        onEdit={() => openEditForm(parcel)}
                        onDelete={() => setDeletingParcel(parcel)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {parcels.map((parcel) => (
              <EntityCard
                key={parcel.id}
                entityKey="parcels"
                title={parcel.name}
                subtitle={`${parcel.farmName} · ${formatArea(parcel.areaHa)} ha`}
                right={
                  <ParcelRowActions
                    parcel={parcel}
                    onEdit={() => openEditForm(parcel)}
                    onDelete={() => setDeletingParcel(parcel)}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      <ParcelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        parcel={editingParcel}
      />
      <DeleteParcelDialog
        open={!!deletingParcel}
        onOpenChange={(open) => !open && setDeletingParcel(null)}
        parcel={deletingParcel}
      />
    </main>
  );
}

function ParcelRowActions({
  parcel,
  onEdit,
  onDelete,
}: {
  parcel: Parcel;
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
            aria-label={`Veprime për ${parcel.name}`}
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