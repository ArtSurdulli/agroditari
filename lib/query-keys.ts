// Query-key factory pattern. Add one namespace per entity as it's built,
// following the shape used for farms below.

export const keys = {
  farms: {
    all: ["farms"] as const,
    list: (params?: { q?: string }) =>
      ["farms", "list", params ?? {}] as const,
    detail: (id: string) => ["farms", "detail", id] as const,
  },
  parcels: {
    all: ["parcels"] as const,
    list: (params?: { q?: string; farmId?: string }) =>
      ["parcels", "list", params ?? {}] as const,
    detail: (id: string) => ["parcels", "detail", id] as const,
  },
  crops: {
    all: ["crops"] as const,
    list: (params?: { q?: string }) =>
      ["crops", "list", params ?? {}] as const,
  },
  cropSeasons: {
    all: ["crop-seasons"] as const,
    list: (params?: { q?: string; parcelId?: string; status?: string }) =>
      ["crop-seasons", "list", params ?? {}] as const,
    detail: (id: string) => ["crop-seasons", "detail", id] as const,
  },
  activities: {
    all: ["activities"] as const,
    list: (params?: {
      q?: string;
      cropSeasonId?: string;
      activityType?: string;
    }) => ["activities", "list", params ?? {}] as const,
    detail: (id: string) => ["activities", "detail", id] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: (params?: { cropSeasonId?: string; category?: string }) =>
      ["expenses", "list", params ?? {}] as const,
    detail: (id: string) => ["expenses", "detail", id] as const,
  },
} as const;