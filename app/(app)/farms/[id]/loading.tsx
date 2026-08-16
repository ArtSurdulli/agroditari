import { BackButton } from "@/components/common/back-button";
import { CardGridSkeleton } from "@/components/common/card-grid-skeleton";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

// Next.js route-level loading UI — shown while the farm detail Server
// Component resolves its Prisma fetch.
export default function FarmDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <BackButton fallbackHref="/farms" />

      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <CardGridSkeleton count={4} className="mt-6" />

      <div className="mt-8">
        <Skeleton className="h-4 w-24" />
        <div className="mt-3">
          <ListSkeleton rows={3} columns={2} />
        </div>
      </div>
    </main>
  );
}
