"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TAB_TO_SLUG, type TabValue } from "./season-tabs-utils";
import { SeasonActivities } from "./season-activities";
import { SeasonExpenses } from "./season-expenses";
import { SeasonHarvests } from "./season-harvests";

type SeasonTabsProps = {
  cropSeasonId: string;
  initialTab: TabValue;
};

export function SeasonTabs({ cropSeasonId, initialTab }: SeasonTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Re-seed the active tab whenever a fresh navigation to this page brings a
  // different `initialTab` (e.g. following a `?tab=` link while already
  // mounted on this season) — adjusted during render, same pattern as
  // useOpenOnFlag, rather than reset in an effect.
  const [tab, setTab] = useState<TabValue>(initialTab);
  const [syncedInitialTab, setSyncedInitialTab] = useState(initialTab);
  if (initialTab !== syncedInitialTab) {
    setSyncedInitialTab(initialTab);
    setTab(initialTab);
  }

  function handleTabChange(value: unknown) {
    const next = value as TabValue;
    setTab(next);
    // A new history entry (not replace) so back/forward moves between tabs.
    router.push(`${pathname}?tab=${TAB_TO_SLUG[next]}`, { scroll: false });
  }

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="mt-8">
      <TabsList>
        <TabsTrigger value="activities">Aktivitete</TabsTrigger>
        <TabsTrigger value="expenses">Shpenzime</TabsTrigger>
        <TabsTrigger value="harvests">Korrje</TabsTrigger>
      </TabsList>
      <TabsContent value="activities" className="mt-4">
        <Suspense>
          <SeasonActivities cropSeasonId={cropSeasonId} />
        </Suspense>
      </TabsContent>
      <TabsContent value="expenses" className="mt-4">
        <Suspense>
          <SeasonExpenses cropSeasonId={cropSeasonId} />
        </Suspense>
      </TabsContent>
      <TabsContent value="harvests" className="mt-4">
        <Suspense>
          <SeasonHarvests cropSeasonId={cropSeasonId} />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
