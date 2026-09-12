import type { LucideIcon } from "lucide-react";
import type { EntityColor } from "@/lib/entity-theme";
import { cn } from "@/lib/utils";

type FeatureSectionProps = {
  icon: LucideIcon;
  color: EntityColor;
  kicker: string;
  title: string;
  body: string;
  reverse?: boolean;
  visual: React.ReactNode;
};

// One alternating text/visual row, reused for every entity feature on the
// landing page — the text side always leads with the entity's icon+color so
// the section is identifiable at a glance while scrolling.
export function FeatureSection({
  icon: Icon,
  color,
  kicker,
  title,
  body,
  reverse,
  visual,
}: FeatureSectionProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12",
        reverse && "md:[&>*:first-child]:order-2"
      )}
    >
      <div>
        <div
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: color.solid }}
        >
          <Icon className="h-5 w-5 text-white" strokeWidth={2} />
        </div>
        <p
          className="mt-4 text-sm font-semibold tracking-wide uppercase"
          style={{ color: color.textSoft }}
        >
          {kicker}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-base text-text-secondary">{body}</p>
      </div>

      <div>{visual}</div>
    </div>
  );
}
