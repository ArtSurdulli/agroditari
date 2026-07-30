// Query-key factory pattern. Add one namespace per entity as it's built,
// following the shape used for farms below.

export const keys = {
  farms: {
    all: ["farms"] as const,
    list: (params?: { q?: string }) =>
      ["farms", "list", params ?? {}] as const,
    detail: (id: string) => ["farms", "detail", id] as const,
  },
} as const;