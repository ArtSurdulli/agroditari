import { z } from "zod";

// Query-param schema for GET /api/reports. Each field is validated
// individually by the route (via .shape.<field>.safeParse(...)) so a
// malformed filter is dropped rather than failing the whole request — this
// is a read endpoint, not a write, so there's nothing to reject outright.
export const reportsQuerySchema = z.object({
  seasonId: z.string().uuid("Sezon i pavlefshëm."),
  parcelId: z.string().uuid("Parcelë e pavlefshme."),
  from: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data nuk është e vlefshme."),
  to: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data nuk është e vlefshme."),
});
