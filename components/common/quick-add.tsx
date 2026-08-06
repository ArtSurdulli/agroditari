"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SEASON_DETAIL_PATTERN = /^\/seasons\/([^/]+)$/;

// On a season detail page, the "+" skips the chooser and offers the season's
// own two entry points directly (season already known, no picking needed).
function useQuickAddSeasonId(): string | null {
  const pathname = usePathname();
  const match = pathname.match(SEASON_DETAIL_PATTERN);
  return match ? match[1] : null;
}

function SeasonQuickAddMenu({
  seasonId,
  triggerClassName,
  children,
}: {
  seasonId: string;
  triggerClassName: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Shto"
            className={triggerClassName}
          />
        }
      >
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={<Link href={`/seasons/${seasonId}?new=activities`} />}
        >
          Aktivitet
        </DropdownMenuItem>
        <DropdownMenuItem
          render={<Link href={`/seasons/${seasonId}?new=expenses`} />}
        >
          Shpenzim
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function QuickAddDesktopButton() {
  const seasonId = useQuickAddSeasonId();
  const className = cn(buttonVariants(), "gap-1.5");

  if (seasonId) {
    return (
      <SeasonQuickAddMenu seasonId={seasonId} triggerClassName={className}>
        <Plus className="h-4 w-4" />
        Shto
      </SeasonQuickAddMenu>
    );
  }

  return (
    <Link href="/shto" className={className}>
      <Plus className="h-4 w-4" />
      Shto
    </Link>
  );
}

const FAB_CLASSNAME =
  "fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95";

export function QuickAddFab() {
  const seasonId = useQuickAddSeasonId();

  if (seasonId) {
    return (
      <SeasonQuickAddMenu seasonId={seasonId} triggerClassName={FAB_CLASSNAME}>
        <Plus className="h-6 w-6" />
      </SeasonQuickAddMenu>
    );
  }

  return (
    <Link href="/shto" aria-label="Shto" className={FAB_CLASSNAME}>
      <Plus className="h-6 w-6" />
    </Link>
  );
}