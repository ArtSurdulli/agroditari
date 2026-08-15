import { Loader2 } from "lucide-react";
import type { EntityKey } from "@/lib/entity-theme";
import { getEntityTheme } from "@/lib/entity-theme";

type LoadingStateProps = {
  entityKey: EntityKey;
  label?: string;
};

// Themed centered spinner shown while a list is loading, instead of a blank
// screen or plain text.
export function LoadingState({
  entityKey,
  label = "Duke ngarkuar...",
}: LoadingStateProps) {
  const theme = getEntityTheme(entityKey);

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Loader2
        className="h-6 w-6 animate-spin"
        style={{ color: theme.color.solid }}
      />
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}