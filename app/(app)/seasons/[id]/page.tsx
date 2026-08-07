import { Suspense } from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/common/back-button";
import { PageHeader } from "@/components/common/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { entityTheme } from "@/lib/entity-theme";
import { seasonStatusLabels } from "@/lib/validations/crop-season";
import { SeasonActivities } from "./season-activities";
import { SeasonExpenses } from "./season-expenses";
import { SeasonHarvests } from "./season-harvests";

type SeasonDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
};

const TAB_VALUES = ["activities", "expenses", "harvests"] as const;

export default async function SeasonDetailPage({
  params,
  searchParams,
}: SeasonDetailPageProps) {
  const { id } = await params;
  const { new: quickAdd } = await searchParams;
  const activeTab = (TAB_VALUES as readonly string[]).includes(
    quickAdd ?? ""
  )
    ? (quickAdd as (typeof TAB_VALUES)[number])
    : "activities";
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

      <Tabs defaultValue={activeTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="activities">Aktivitete</TabsTrigger>
          <TabsTrigger value="expenses">Shpenzime</TabsTrigger>
          <TabsTrigger value="harvests">Korrje</TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="mt-4">
          <Suspense>
            <SeasonActivities cropSeasonId={season.id} />
          </Suspense>
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <Suspense>
            <SeasonExpenses cropSeasonId={season.id} />
          </Suspense>
        </TabsContent>
        <TabsContent value="harvests" className="mt-4">
          <Suspense>
            <SeasonHarvests cropSeasonId={season.id} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </main>
  );
}