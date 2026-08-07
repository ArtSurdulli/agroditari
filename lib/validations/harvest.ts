import { z } from "zod";
import { unitTypeValues } from "@/lib/validations/crop";

export { unitTypeValues };

// Albanian labels for the shared UnitType enum (defined once in
// lib/validations/crop.ts) — kept here since harvests are the first UI to
// actually need translated unit labels.
export const unitTypeLabels: Record<(typeof unitTypeValues)[number], string> = {
  kg: "Kilogram",
  ton: "Ton",
  liter: "Litër",
  piece: "Copë",
  sack: "Thes",
  packet: "Pako",
  hour: "Orë",
  day: "Ditë",
};

// Albanian-locale decimal input writes "0,12" — normalize the comma to a dot
// before coercing to a number, same fix as parcels' areaHa and expenses.
function normalizeDecimal(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed.replace(",", ".");
  }
  return value;
}

function optionalPositiveNumber(label: string) {
  return z.preprocess(
    normalizeDecimal,
    z.coerce
      .number({ error: `${label} duhet të jetë numër.` })
      .positive(`${label} duhet të jetë më e madhe se 0.`)
      .optional()
  );
}

function requiredPositiveNumber(label: string) {
  return z.preprocess(
    normalizeDecimal,
    z.coerce
      .number({ error: `${label} duhet të jetë numër.` })
      .positive(`${label} duhet të jetë më e madhe se 0.`)
  );
}

// No cross-field refine here (unlike expenses' amount): revenue is optional
// and the task frames quantity × unitPrice as a client-side default/UX
// convenience, not a server-enforced invariant — so .partial() works
// directly for PATCH, no unrefined base schema needed.
export const harvestSchema = z.object({
  cropSeasonId: z.string().uuid("Zgjidh një sezon të vlefshëm."),
  quantity: requiredPositiveNumber("Sasia"),
  unit: z.enum(unitTypeValues, {
    error: "Njësia e zgjedhur nuk është e vlefshme.",
  }),
  unitPrice: optionalPositiveNumber("Çmimi për njësi"),
  revenue: optionalPositiveNumber("Të ardhurat"),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data nuk është e vlefshme."),
});

export type HarvestInput = z.infer<typeof harvestSchema>;