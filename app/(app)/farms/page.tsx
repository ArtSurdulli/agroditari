"use client";

import { Suspense, useState } from "react";
import { MoreVertical, Plus, Search, Tractor } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { Input } from "@/components/ui/input";
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
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { useFarms } from "@/hooks/use-farms";
import { useOpenOnFlag } from "@/hooks/use-open-on-flag";
import { FarmFormDialog } from "./farm-form-dialog";
import { DeleteFarmDialog } from "./delete-farm-dialog";
import type { Farm } from "@/types/farm";

export default function FarmsPage() {
  return (
    <Suspense>
      <FarmsPageContent />
    </Suspense>
  );
}

function FarmsPageContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const {
    data: farms,
    isLoading,
    isError,
    error,
  } = useFarms({ q: debouncedSearch });

  // Quick-add ("+ Shto") deep link: /farms?new=1 opens the create dialog
  // straight away.
  const [formOpen, setFormOpen] = useOpenOnFlag("new");

  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [deletingFarm, setDeletingFarm] = useState<Farm | null>(null);

  function openCreateForm() {
    setEditingFarm(null);
    setFormOpen(true);
  }

  function openEditForm(farm: Farm) {
    setEditingFarm(farm);
    setFormOpen(true);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Fermat"
        subtitle="Menaxho fermat e tua."
        actions={
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4" />
            Shto fermë
          </Button>
        }
      />

      <div className="relative mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kërko ferma..."
          className="pl-9"
        />
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
        ) : !farms || farms.length === 0 ? (
          debouncedSearch ? (
            <EmptyState
              icon={Search}
              title="Nuk u gjet asnjë fermë."
              description="Provo një kërkim tjetër."
            />
          ) : (
            <EmptyState
              icon={Tractor}
              title="Ende s'ka ferma."
              description="Shto fermën tënde të parë për të filluar."
              action={
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4" />
                  Shto fermë
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
                  <TableHead>Vendndodhja</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {farms.map((farm) => (
                  <TableRow key={farm.id}>
                    <TableCell className="font-medium text-text-primary">
                      {farm.name}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {farm.location || "—"}
                    </TableCell>
                    <TableCell>
                      <FarmRowActions
                        farm={farm}
                        onEdit={() => openEditForm(farm)}
                        onDelete={() => setDeletingFarm(farm)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {farms.map((farm) => (
              <EntityCard
                key={farm.id}
                entityKey="farms"
                title={farm.name}
                subtitle={farm.location}
                right={
                  <FarmRowActions
                    farm={farm}
                    onEdit={() => openEditForm(farm)}
                    onDelete={() => setDeletingFarm(farm)}
                  />
                }
              />
            ))}
          </div>
        )}
      </div>

      <FarmFormDialog open={formOpen} onOpenChange={setFormOpen} farm={editingFarm} />
      <DeleteFarmDialog
        open={!!deletingFarm}
        onOpenChange={(open) => !open && setDeletingFarm(null)}
        farm={deletingFarm}
      />
    </main>
  );
}

function FarmRowActions({
  farm,
  onEdit,
  onDelete,
}: {
  farm: Farm;
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
            aria-label={`Veprime për ${farm.name}`}
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