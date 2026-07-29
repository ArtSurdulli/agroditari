import { Inbox, type LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  icon: Icon = Inbox,
  title = "Ende s'ka të dhëna.",
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
        <Icon className="h-6 w-6 text-primary" />
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