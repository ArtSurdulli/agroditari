// Query-key factory pattern. Add one namespace per entity as it's built,
// following this shape:
//
// export const keys = {
//   farms: {
//     all: ["farms"] as const,
//     detail: (id: string) => ["farms", id] as const,
//   },
// };

export const keys = {} as const;