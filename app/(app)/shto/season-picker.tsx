"use client";

import { BackButton } from "@/components/common/back-button";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { PageHeader } from "@/components/common/page-header";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { entityTheme } from "@/lib/entity-theme";

type SeasonPickerProps = {
  target: "activities" | "expenses" | "harvests";
  title: string;
};

export function SeasonPicker({ target, title }: SeasonPickerProps) {
  const { data: seasons, isLoading, isError, error } = useCropSeasons();
  const Icon = entityTheme.seasons.icon;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <BackButton fallbackHref="/shto" />

      <PageHeader
        title={title}
        subtitle="Zgjidh sezonin ku dëshiron ta shtosh."
      />

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Duke ngarkuar...</p>
        ) : isError ? (
          <p className="text-sm text-danger">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim. Provo përsëri."}
          </p>
        ) : !seasons || seasons.length === 0 ? (
          <EmptyState
            icon={Icon}
            title="Ende s'ka sezone."
            description="Shto një sezon së pari."
          />
        ) : (
          seasons.map((season) => (
            <EntityCard
              key={season.id}
              entityKey="seasons"
              href={`/seasons/${season.id}?new=${target}`}
              title={`${season.cropName} · ${season.season}`}
              subtitle={`${season.parcelName} — ${season.farmName}`}
              className="min-h-[72px]"
            />
          ))
        )}
      </div>
    </main>
  );
}