import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BAR_HEIGHTS = [38, 62, 48, 80, 55, 70, 45];

type ChartSkeletonProps = {
  className?: string;
};

// Shaped loading placeholder for the revenue-vs-cost bar chart — caller
// supplies the height (e.g. "h-64"/"h-72") to match the real chart container.
export function ChartSkeleton({ className }: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface p-4",
        className
      )}
    >
      <div className="flex h-full items-end justify-between gap-2">
        {BAR_HEIGHTS.map((height, index) => (
          <Skeleton
            key={index}
            className="w-full rounded-t-md"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}
