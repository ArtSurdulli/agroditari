import type { unitTypeValues } from "@/lib/validations/crop";

// Client-side shape of a Crop as it arrives over JSON. Crops are global
// (isDefault = seeded AgroDitari crop, false = user-created) — never
// ownership-filtered.
export type Crop = {
  id: string;
  name: string;
  category: string | null;
  standardUnit: (typeof unitTypeValues)[number] | null;
  isDefault: boolean;
  createdAt: string;
};