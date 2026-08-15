import { z } from "zod";

export const parcelSchema = z.object({
  farmId: z.string().uuid("Zgjidh një fermë të vlefshme."),
  name: z
    .string()
    .trim()
    .min(2, "Emri duhet të ketë të paktën 2 shkronja.")
    .max(120, "Emri mund të ketë deri në 120 shkronja."),
  areaHa: z.coerce
    .number({ error: "Sipërfaqja duhet të jetë numër." })
    .positive("Sipërfaqja duhet të jetë më e madhe se 0.")
    .max(100000, "Sipërfaqja është shumë e madhe."),
  soilType: z
    .string()
    .trim()
    .max(80, "Lloji i tokës mund të ketë deri në 80 shkronja.")
    .optional(),
});

export type ParcelInput = z.infer<typeof parcelSchema>;
