import type { LucideIcon } from "lucide-react";
import type { EntityColor } from "@/lib/entity-theme";

type FeatureVisualRow = {
  label: string;
  value: string;
};

type FeatureVisualProps = {
  icon: LucideIcon;
  color: EntityColor;
  rows: FeatureVisualRow[];
  // Small overlapping badge for sections that span two entities (e.g. Fermat
  // & Parcelat) — omit for single-entity sections.
  secondaryIcon?: LucideIcon;
  secondaryColor?: EntityColor;
};

// Presentational stand-in for a real screenshot: a tinted panel carrying the
// section's icon and a couple of realistic-looking sample rows, so every
// feature section has a cohesive visual without needing a dedicated product
// screenshot for each one.
export function FeatureVisual({
  icon: Icon,
  color,
  rows,
  secondaryIcon: SecondaryIcon,
  secondaryColor,
}: FeatureVisualProps) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
      style={{ backgroundColor: color.tint, borderColor: color.border }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
          style={{ backgroundColor: color.solid }}
        >
          <Icon className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        {SecondaryIcon && secondaryColor && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: secondaryColor.solid }}
          >
            <SecondaryIcon className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
        )}
      </div>

      <div className="mt-6 space-y-2.5">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl bg-surface/90 px-4 py-3"
          >
            <span
              className="text-sm font-medium"
              style={{ color: color.textStrong }}
            >
              {row.label}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: color.textStrong }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
