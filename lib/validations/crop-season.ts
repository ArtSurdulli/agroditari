import { z } from "zod";

// Mirrors the Prisma SeasonStatus enum values.
export const seasonStatusValues = ["active", "harvested", "closed"] as const;

export const seasonStatusLabels: Record<
  (typeof seasonStatusValues)[number],
  string
> = {
  active: "Aktiv",
  harvested: "I korrur",
  closed: "I mbyllur",
};

// HTML date inputs submit "YYYY-MM-DD" or "" when cleared — treat "" (and
// whitespace) as "no date" rather than a validation failure.
const isoDateString = z
  .string()
  .optional()
  .transform((val) => (val && val.trim() !== "" ? val.trim() : undefined))
  .refine((val) => val === undefined || /^\d{4}-\d{2}-\d{2}$/.test(val), {
    message: "Data nuk është e vlefshme.",
  });

// Unrefined base — used directly (via .partial()) for PATCH, where cross-field
// date-order validation has to happen against the merged existing+incoming
// record rather than the raw partial payload.
export const cropSeasonBaseSchema = z.object({
  parcelId: z.string().uuid("Zgjidh një parcelë të vlefshme."),
  cropId: z.string().uuid("Zgjidh një kulturë të vlefshme."),
  season: z
    .string()
    .trim()
    .min(2, "Sezoni duhet të ketë të paktën 2 shkronja.")
    .max(60, "Sezoni mund të ketë deri në 60 shkronja."),
  status: z
    .enum(seasonStatusValues, {
      error: "Statusi i zgjedhur nuk është i vlefshëm.",
    })
    .optional(),
  sowingDate: isoDateString,
  expectedHarvestDate: isoDateString,
});

export const cropSeasonSchema = cropSeasonBaseSchema.refine(
  (data) =>
    !data.sowingDate ||
    !data.expectedHarvestDate ||
    data.expectedHarvestDate > data.sowingDate,
  {
    message: "Data e korrjes duhet të jetë pas datës së mbjelljes.",
    path: ["expectedHarvestDate"],
  }
);

export type CropSeasonInput = z.infer<typeof cropSeasonSchema>;
