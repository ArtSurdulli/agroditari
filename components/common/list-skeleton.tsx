import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ListSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
};

// Shaped loading placeholder for entity lists: a desktop table skeleton
// (hidden below `md`) and a mobile EntityCard-shaped skeleton (hidden at
// `md`+), matching the real desktop-table / mobile-card split every entity
// list page already renders.
export function ListSkeleton({
  rows = 5,
  columns = 3,
  className,
}: ListSkeletonProps) {
  return (
    <div className={className}>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
        <table className="w-full">
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-border",
                  rowIndex < rows - 1 && "border-b"
                )}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="p-2">
                    <Skeleton
                      className={cn(
                        "h-4",
                        colIndex === 0 ? "w-32" : "w-20"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-border p-4"
          >
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
