"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { useDeleteFarm } from "@/hooks/use-farms";
import { FarmFormDialog } from "../farm-form-dialog";
import type { Farm } from "@/types/farm";

// Edit/delete for the farm detail page's header — reuses the same dialogs
// the farms list uses. The page itself is a Server Component (a one-off
// read), so a successful edit refreshes it to pick up the new name/location,
// and a successful delete navigates back to the list instead of refreshing
// a now-404 page.
export function FarmDetailActions({ farm }: { farm: Farm }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteFarm = useDeleteFarm();

  return (
    <div className="shrink-0">
      <RowActionsMenu
        ariaLabel={`Veprime për ${farm.name}`}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <FarmFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) router.refresh();
        }}
        farm={farm}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Fshi fermën"
        description={
          <>
            Je i sigurt që dëshiron të fshish fermën <strong>{farm.name}</strong>?
            Ky veprim nuk kthehet mbrapsht.
          </>
        }
        pending={deleteFarm.isPending}
        onConfirm={async () => {
          await deleteFarm.mutateAsync(farm.id);
          router.push("/farms");
        }}
      />
    </div>
  );
}
