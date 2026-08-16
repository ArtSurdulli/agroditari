import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EntityColor } from "@/lib/entity-theme";
import { cn } from "@/lib/utils";

type DeltaTone = "up" | "down" | "neutral";

type StatCardProps = {
  label: string;
  // Multiple entries (e.g. quantities grouped by unit, which are never
  // summed across units) render as tidy stacked lines instead of one
  // comma-joined string that wraps mid-word.
  value: string | number | string[];
  delta?: string;
  deltaTone?: DeltaTone;
  icon?: LucideIcon;
  // When set, tints the icon tile and adds a left accent bar in the given
  // entity's color instead of the generic primary green.
  color?: EntityColor;
  // Tighter padding and a smaller icon tile, for totals shown inline above a
  // list (season tabs, entity list pages) rather than as dashboard KPIs.
  compact?: boolean;
};

const toneStyles: Record<DeltaTone, string> = {
  up: "text-primary",
  down: "text-danger",
  neutral: "text-text-secondary",
};

const toneIcons: Record<DeltaTone, LucideIcon> = {
  up: ArrowUp,
  down: ArrowDown,
  neutral: Minus,
};

function formatValue(value: string | number) {
  if (typeof value === "number") {
    return Math.round(value).toLocaleString("sq-AL");
  }
  return value;
}

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "neutral",
  icon: Icon,
  color,
  compact = false,
}: StatCardProps) {
  const ToneIcon = toneIcons[deltaTone];
  const values = Array.isArray(value) ? value : [formatValue(value)];
  const stacked = values.length > 1;

  return (
    <Card
      size={compact ? "sm" : "default"}
      className={cn(color && "border-l-4")}
      style={color ? { borderLeftColor: color.border } : undefined}
    >
      <CardContent
        className={cn("flex items-start justify-between", compact ? "gap-3" : "gap-4")}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "text-text-secondary",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {label}
          </p>
          {stacked ? (
            <div className={cn("flex flex-col", compact ? "mt-0.5" : "mt-1")}>
              {values.map((part, index) => (
                <p
                  key={index}
                  className={cn(
                    "truncate leading-tight font-semibold text-text-primary",
                    compact ? "text-base" : "text-xl"
                  )}
                >
                  {part}
                </p>
              ))}
            </div>
          ) : (
            <p
              className={cn(
                "truncate font-semibold text-text-primary",
                compact ? "mt-0.5 text-lg" : "mt-1 text-2xl"
              )}
            >
              {values[0]}
            </p>
          )}
          {delta && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-sm font-medium",
                toneStyles[deltaTone]
              )}
            >
              <ToneIcon className="h-3.5 w-3.5" />
              {delta}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg bg-primary-light",
              compact ? "h-8 w-8" : "h-10 w-10"
            )}
            style={color ? { backgroundColor: color.tint } : undefined}
          >
            <Icon
              className={compact ? "h-4 w-4 text-primary" : "h-5 w-5 text-primary"}
              style={color ? { color: color.solid } : undefined}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}