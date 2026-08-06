import { z } from "zod";

// Mirrors the Prisma ActivityType enum values.
export const activityTypeValues = [
  "sowing",
  "fertilizing",
  "irrigation",
  "spraying",
  "weeding",
  "harvesting",
  "other",
] as const;

export const activityTypeLabels: Record<
  (typeof activityTypeValues)[number],
  string
> = {
  sowing: "Mbjellje",
  fertilizing: "Plehërim",
  irrigation: "Ujitje",
  spraying: "Spërkatje",
  weeding: "Prashitje",
  harvesting: "Korrje",
  other: "Tjetër",
};

export const activitySchema = z.object({
  cropSeasonId: z.string().uuid("Zgjidh një sezon të vlefshëm."),
  activityType: z.enum(activityTypeValues, {
    error: "Lloji i aktivitetit nuk është i vlefshëm.",
  }),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data nuk është e vlefshme."),
  notes: z
    .string()
    .trim()
    .max(1000, "Shënimet mund të kenë deri në 1000 shkronja.")
    .optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;