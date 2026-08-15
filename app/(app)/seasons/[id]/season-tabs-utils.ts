// Plain, server-safe module (no "use client") — the season detail Server
// Component needs to compute the initial tab itself, so this pure mapping
// logic can't live in the client-only season-tabs.tsx alongside the
// interactive Tabs component.

export const TAB_VALUES = ["activities", "expenses", "harvests"] as const;
export type TabValue = (typeof TAB_VALUES)[number];

// Albanian slugs used in the shareable `?tab=` URL — kept distinct from the
// internal English tab values (which also match the `?new=` quick-add flag).
export const TAB_TO_SLUG: Record<TabValue, string> = {
  activities: "aktivitete",
  expenses: "shpenzime",
  harvests: "korrje",
};

const SLUG_TO_TAB: Record<string, TabValue> = {
  aktivitete: "activities",
  shpenzime: "expenses",
  korrje: "harvests",
};

// `?new=` (quick-add target, English) takes priority — it also drives which
// dialog auto-opens, so the tab it names must win. `?tab=` (Albanian slug)
// only decides the tab when `?new=` is absent. Defaults to "activities".
export function resolveInitialTab(tab?: string, quickAdd?: string): TabValue {
  if (quickAdd && (TAB_VALUES as readonly string[]).includes(quickAdd)) {
    return quickAdd as TabValue;
  }
  if (tab && tab in SLUG_TO_TAB) {
    return SLUG_TO_TAB[tab];
  }
  return "activities";
}
