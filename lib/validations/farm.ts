import { z } from "zod";

export const farmSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Emri duhet të ketë të paktën 2 shkronja.")
    .max(120, "Emri mund të ketë deri në 120 shkronja."),
  location: z
    .string()
    .trim()
    .max(200, "Vendndodhja mund të ketë deri në 200 shkronja.")
    .optional(),
});

export type FarmInput = z.infer<typeof farmSchema>;