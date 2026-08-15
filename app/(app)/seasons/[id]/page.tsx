import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/common/back-button";
import { PageHeader } from "@/components/common/page-header";
import { entityTheme } from "@/lib/entity-theme";
import { seasonStatusLabels } from "@/lib/validations/crop-season";
import { SeasonTabs } from "./season-tabs";
import { resolveInitialTab } from "./season-tabs-utils";

type SeasonDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string; tab?: string }>;
};

export default async function SeasonDetailPage({
  params,
  searchParams,
}: SeasonDetailPageProps) {
  const { id } = await params;
  const { new: quickAdd, tab } = await searchParams;
  const initialTab = resolveInitialTab(tab, quickAdd);
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const season = await prisma.cropSeason.findUnique({
    where: { id },
    include: { parcel: { include: { farm: true } }, crop: true },
  });

  // Three-hop ownership (season -> parcel -> farm -> user), same as the API.
  if (!season || season.parcel.farm.userId !== session.user.id) {
    notFound();
  }

  const { badgeBg, textStrong } = entityTheme.seasons.color;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <BackButton fallbackHref="/seasons" />

      <PageHeader
        title={`${season.crop.name} — ${season.season}`}
        subtitle={`${season.parcel.name} — ${season.parcel.farm.name}`}
        actions={
          <span
            className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: badgeBg, color: textStrong }}
          >
            {seasonStatusLabels[season.status]}
          </span>
        }
      />

      <SeasonTabs cropSeasonId={season.id} initialTab={initialTab} />
    </main>
  );
}