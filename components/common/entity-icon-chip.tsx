import type { EntityKey } from "@/lib/entity-theme";
import { getEntityTheme } from "@/lib/entity-theme";
import { cn } from "@/lib/utils";

type EntityIconChipProps = {
  entityKey: EntityKey;
  size?: "sm" | "lg";
  className?: string;
};

const sizeClasses: Record<NonNullable<EntityIconChipProps["size"]>, string> =
  {
    sm: "h-8 w-8 rounded-lg [&_svg]:h-4 [&_svg]:w-4",
    lg: "h-11 w-11 rounded-xl [&_svg]:h-5 [&_svg]:w-5",
  };

// Solid-color icon tile used to brand a dialog header or a table row's
// primary cell with its entity's color, per lib/entity-theme.ts.
export function EntityIconChip({
  entityKey,
  size = "sm",
  className,
}: EntityIconChipProps) {
  const theme = getEntityTheme(entityKey);
  const Icon = theme.icon;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: theme.color.solid }}
    >
      <Icon className="text-white" strokeWidth={2} />
    </div>
  );
}