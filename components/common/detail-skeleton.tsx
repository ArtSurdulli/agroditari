import { Skeleton } from "@/components/ui/skeleton";
import { ListSkeleton } from "@/components/common/list-skeleton";

// Shaped loading placeholder for a detail page: PageHeader (title + subtitle
// + a trailing badge) and a tabbed section below it.
export function DetailSkeleton() {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="mt-8">
        <div className="flex w-fit gap-1 rounded-lg bg-muted p-1">
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </div>
        <div className="mt-4">
          <ListSkeleton rows={4} columns={3} />
        </div>
      </div>
    </div>
  );
}
