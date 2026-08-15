import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EntityIconChip } from "@/components/common/entity-icon-chip";
import type { EntityKey } from "@/lib/entity-theme";
import { getEntityTheme } from "@/lib/entity-theme";

type EntityDialogHeaderProps = {
  entityKey: EntityKey;
  title: string;
};

// Colored strip header for entity create/edit dialogs: an icon tile in the
// entity's solid color, and the title in its strong text color, on a tinted
// background — bleeds to the dialog's edges the same way DialogFooter does.
export function EntityDialogHeader({
  entityKey,
  title,
}: EntityDialogHeaderProps) {
  const theme = getEntityTheme(entityKey);

  return (
    <DialogHeader
      className="-mx-4 -mt-4 flex-row items-center gap-3 rounded-t-xl px-4 py-4"
      style={{ backgroundColor: theme.color.tint }}
    >
      <EntityIconChip entityKey={entityKey} size="lg" />
      <DialogTitle
        className="text-base font-semibold"
        style={{ color: theme.color.textStrong }}
      >
        {title}
      </DialogTitle>
    </DialogHeader>
  );
}