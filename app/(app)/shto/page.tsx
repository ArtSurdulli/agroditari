"use client";

import { BackButton } from "@/components/common/back-button";
import { EntityCard } from "@/components/common/entity-card";
import { PageHeader } from "@/components/common/page-header";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import type { EntityKey } from "@/lib/entity-theme";

type QuickAddOption = {
  entityKey: EntityKey;
  label: string;
  helper: string;
  href: string;
};

export default function QuickAddPage() {
  const { data: seasons, isLoading } = useCropSeasons();
  const hasSeasons = !isLoading && !!seasons && seasons.length > 0;

  const seasonScopedHelper = isLoading
    ? "Duke kontrolluar..."
    : hasSeasons
      ? undefined
      : "Së pari shto një sezon.";

  const options: QuickAddOption[] = [
    {
      entityKey: "farms",
      label: "Fermë",
      helper: "Toka jote",
      href: "/farms?new=1",
    },
    {
      entityKey: "parcels",
      label: "Parcelë",
      helper: "Një pjesë e fermës",
      href: "/parcels?new=1",
    },
    {
      entityKey: "seasons",
      label: "Sezon",
      helper: "Çfarë mbjell dhe kur",
      href: "/seasons?new=1",
    },
    {
      entityKey: "activities",
      label: "Aktivitet",
      helper: seasonScopedHelper ?? "Punë në fushë (ujitje, plehërim...)",
      href: hasSeasons ? "/shto/aktivitet" : "/seasons?new=1",
    },
    {
      entityKey: "expenses",
      label: "Shpenzim",
      helper: seasonScopedHelper ?? "Para që shpenzove",
      href: hasSeasons ? "/shto/shpenzim" : "/seasons?new=1",
    },
    {
      entityKey: "harvests",
      label: "Korrje",
      helper: seasonScopedHelper ?? "Sa korrite dhe sa fitove",
      href: hasSeasons ? "/shto/korrje" : "/seasons?new=1",
    },
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <BackButton fallbackHref="/" />

      <PageHeader
        title="Çfarë do të shtosh?"
        subtitle="Zgjidh çfarë dëshiron të regjistrosh."
      />

      <div className="mt-6 space-y-3">
        {options.map((option) => (
          <EntityCard
            key={option.entityKey}
            entityKey={option.entityKey}
            href={option.href}
            title={option.label}
            subtitle={option.helper}
            className="min-h-[72px]"
          />
        ))}
      </div>
    </main>
  );
}