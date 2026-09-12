import Image from "next/image";
import { cn } from "@/lib/utils";

type DeviceFrameProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  urlPath: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

// Light, CSS-only "browser window" chrome around a product screenshot — three
// faux traffic-light dots plus an address pill, so the PNG reads as a real
// product shot rather than a bare image dropped on the page.
export function DeviceFrame({
  src,
  alt,
  width,
  height,
  urlPath,
  priority,
  sizes = "(min-width: 768px) 560px, 100vw",
  className,
}: DeviceFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface shadow-lg shadow-black/5",
        "motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out",
        "motion-safe:hover:-translate-y-1.5 motion-safe:hover:shadow-xl",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-bg-page px-4 py-2.5">
        <div className="flex shrink-0 gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex h-6 flex-1 items-center rounded-full border border-border bg-surface px-3">
          <span className="truncate text-xs text-text-secondary">
            {urlPath}
          </span>
        </div>
      </div>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        sizes={sizes}
        className="h-auto w-full"
      />
    </div>
  );
}
