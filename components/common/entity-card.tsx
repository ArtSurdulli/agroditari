import Link from "next/link";
import type { EntityKey } from "@/lib/entity-theme";
import { getEntityTheme } from "@/lib/entity-theme";
import { cn } from "@/lib/utils";

type EntityCardProps = {
  entityKey: EntityKey;
  title: string;
  subtitle?: string | null;
  badge?: string;
  right?: React.ReactNode;
  // Makes the whole card navigate to a detail page. Implemented as a
  // "stretched link" (an absolutely-positioned Link sibling, not a wrapper)
  // so it can coexist with an interactive `right` slot (e.g. a dropdown
  // trigger button) without nesting one clickable element inside another.
  href?: string;
  className?: string;
};

export function EntityCard({
  entityKey,
  title,
  subtitle,
  badge,
  right,
  href,
  className,
}: EntityCardProps) {
  const theme = getEntityTheme(entityKey);
  const Icon = theme.icon;

  return (
    <div
      className={cn(
        "relative flex w-full items-center gap-3 rounded-[14px] border-[1.5px] p-4 text-left transition-colors",
        className
      )}
      style={{
        backgroundColor: theme.color.tint,
        borderColor: theme.color.border,
      }}
    >
      {href && (
        <Link
          href={href}
          aria-label={title}
          className="absolute inset-0 rounded-[14px]"
        />
      )}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: theme.color.solid }}
      >
        <Icon className="h-5 w-5 text-white" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-semibold"
          style={{ color: theme.color.textStrong }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="truncate text-sm"
            style={{ color: theme.color.textSoft }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {badge && (
        <span
          className="relative shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: theme.color.badgeBg,
            color: theme.color.textStrong,
          }}
        >
          {badge}
        </span>
      )}
      {right && <div className="relative shrink-0">{right}</div>}
    </div>
  );
}