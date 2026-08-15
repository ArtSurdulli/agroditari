import { z } from "zod";

// Mirrors the Prisma ExpenseCategory enum values.
export const expenseCategoryValues = [
  "inputs",
  "labor",
  "machinery",
  "transport",
  "rent",
  "other",
] as const;

export const expenseCategoryLabels: Record<
  (typeof expenseCategoryValues)[number],
  string
> = {
  inputs: "Inpute",
  labor: "Punë krahu",
  machinery: "Makineri",
  transport: "Transport",
  rent: "Qira",
  other: "Tjetër",
};

// Albanian-locale decimal input writes "0,12" — normalize the comma to a dot
// before coercing to a number, same fix as parcels' areaHa. Empty/whitespace
// becomes undefined so an optional field can be left blank.
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

// Unrefined base — used directly (via .partial()) for PATCH, where the
// amount = quantity × unitPrice check has to happen against the merged
// existing + incoming record rather than the raw partial payload.
export const expenseBaseSchema = z.object({
  cropSeasonId: z.string().uuid("Zgjidh një sezon të vlefshëm."),
  category: z.enum(expenseCategoryValues, {
    error: "Kategoria e zgjedhur nuk është e vlefshme.",
  }),
  description: z
    .string()
    .trim()
    .max(200, "Përshkrimi mund të ketë deri në 200 shkronja.")
    .optional(),
  quantity: optionalPositiveNumber("Sasia"),
  unitPrice: optionalPositiveNumber("Çmimi për njësi"),
  amount: requiredPositiveNumber("Shuma"),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data nuk është e vlefshme."),
});

const AMOUNT_TOLERANCE = 0.01;

export const expenseSchema = expenseBaseSchema.refine(
  (data) => {
    if (data.quantity === undefined || data.unitPrice === undefined) {
      return true;
    }
    return (
      Math.abs(data.quantity * data.unitPrice - data.amount) <=
      AMOUNT_TOLERANCE
    );
  },
  {
    message: "Shuma duhet të jetë e barabartë me sasinë herë çmimin.",
    path: ["amount"],
  }
);

export type ExpenseInput = z.infer<typeof expenseSchema>;
