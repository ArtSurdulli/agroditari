import { z } from "zod";

// Mirrors the Prisma UnitType enum values — kept as a literal list here so
// this file has no Prisma import (validations stay usable at the edge).
export const unitTypeValues = [
  "kg",
  "ton",
  "liter",
  "piece",
  "sack",
  "packet",
  "hour",
  "day",
] as const;

export const cropSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Emri duhet të ketë të paktën 2 shkronja.")
    .max(100, "Emri mund të ketë deri në 100 shkronja."),
  category: z
    .string()
    .trim()
    .max(80, "Kategoria mund të ketë deri në 80 shkronja.")
    .optional(),
  standardUnit: z
    .enum(unitTypeValues, { error: "Njësia e zgjedhur nuk është e vlefshme." })
    .optional(),
});

export type CropInput = z.infer<typeof cropSchema>;