import type { EntityKey } from "@/lib/entity-theme";
import { getEntityTheme } from "@/lib/entity-theme";
import { cn } from "@/lib/utils";

type EntityCardProps = {
  entityKey: EntityKey;
  title: string;
  subtitle?: string | null;
  badge?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

export function EntityCard({
  entityKey,
  title,
  subtitle,
  badge,
  right,
  onClick,
  className,
}: EntityCardProps) {
  const theme = getEntityTheme(entityKey);
  const Icon = theme.icon;

  const content = (
    <>
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
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: theme.color.badgeBg,
            color: theme.color.textStrong,
          }}
        >
          {badge}
        </span>
      )}
      {right && <div className="shrink-0">{right}</div>}
    </>
  );

  const sharedClassName = cn(
    "flex w-full items-center gap-3 rounded-[14px] border-[1.5px] p-4 text-left transition-colors",
    onClick && "cursor-pointer active:translate-y-px",
    className
  );
  const style = {
    backgroundColor: theme.color.tint,
    borderColor: theme.color.border,
  };

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={sharedClassName} style={style}>
        {content}
      </button>
    );
  }

  return (
    <div className={sharedClassName} style={style}>
      {content}
    </div>
  );
}