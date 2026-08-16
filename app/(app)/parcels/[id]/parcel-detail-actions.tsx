"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RowActionsMenu } from "@/components/common/row-actions-menu";
import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { useDeleteParcel } from "@/hooks/use-parcels";
import { ParcelFormDialog } from "../parcel-form-dialog";
import type { Parcel } from "@/types/parcel";

// Edit/delete for the parcel detail page's header — reuses the same dialogs
// the parcels list uses. The page itself is a Server Component (a one-off
// read), so a successful edit refreshes it to pick up new fields, and a
// successful delete navigates back to the list instead of refreshing a
// now-404 page.
export function ParcelDetailActions({ parcel }: { parcel: Parcel }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteParcel = useDeleteParcel();

  return (
    <div className="shrink-0">
      <RowActionsMenu
        ariaLabel={`Veprime për ${parcel.name}`}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <ParcelFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) router.refresh();
        }}
        parcel={parcel}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Fshi parcelën"
        description={
          <>
            Je i sigurt që dëshiron të fshish parcelën{" "}
            <strong>{parcel.name}</strong>? Ky veprim nuk kthehet mbrapsht.
          </>
        }
        pending={deleteParcel.isPending}
        onConfirm={async () => {
          await deleteParcel.mutateAsync(parcel.id);
          router.push("/parcels");
        }}
      />
    </div>
  );
}
