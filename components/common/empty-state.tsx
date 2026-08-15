import { Inbox, type LucideIcon } from "lucide-react";
import type { EntityKey } from "@/lib/entity-theme";
import { getEntityTheme } from "@/lib/entity-theme";

type EmptyStateProps = {
  // When set, the icon circle and icon use the entity's theme colors instead
  // of the generic primary green.
  entityKey?: EntityKey;
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  entityKey,
  icon,
  title = "Ende s'ka të dhëna.",
  description,
  action,
}: EmptyStateProps) {
  const theme = entityKey ? getEntityTheme(entityKey) : null;
  const Icon = icon ?? theme?.icon ?? Inbox;

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light"
        style={theme ? { backgroundColor: theme.color.tint } : undefined}
      >
        <Icon
          className="h-6 w-6 text-primary"
          style={theme ? { color: theme.color.solid } : undefined}
        />
      </div>
      <div>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}