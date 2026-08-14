import Link from "next/link";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type RowActionsMenuProps = {
  ariaLabel: string;
  viewHref?: string;
  viewLabel?: string;
  onEdit: () => void;
  onDelete: () => void;
};

// Shared 3-dot row menu (Ndrysho/Fshi, plus an optional "Shiko X" link) used
// by every entity's list/table rows.
export function RowActionsMenu({
  ariaLabel,
  viewHref,
  viewLabel,
  onEdit,
  onDelete,
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={ariaLabel} />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {viewHref && (
          <DropdownMenuItem render={<Link href={viewHref} />}>
            {viewLabel}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onEdit}>Ndrysho</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          Fshi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}