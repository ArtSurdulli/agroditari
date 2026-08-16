import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type CardGridSkeletonProps = {
  count?: number;
  className?: string;
};

// Shaped loading placeholder for a row of StatCards (KPI cards) — mirrors
// StatCard's own layout (label + value on the left, icon tile on the right).
export function CardGridSkeleton({
  count = 4,
  className,
}: CardGridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-start justify-between gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
        >
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
