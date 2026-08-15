import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DeltaTone = "up" | "down" | "neutral";

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: DeltaTone;
  icon?: LucideIcon;
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
}: StatCardProps) {
  const ToneIcon = toneIcons[deltaTone];

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">
            {formatValue(value)}
          </p>
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}