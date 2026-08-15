import type { unitTypeValues } from "@/lib/validations/crop";

// Client-side shape of a Harvest as it arrives over JSON (Decimal serializes
// as a string). Ownership is four hops away (Harvest -> CropSeason -> Parcel
// -> Farm -> User), so the season label, crop name, and parcel name are
// included here for display.
export type Harvest = {
  id: string;
  cropSeasonId: string;
  season: string;
  cropName: string;
  parcelName: string;
  quantity: string;
  unit: (typeof unitTypeValues)[number];
  unitPrice: string | null;
  revenue: string | null;
  date: string;
  createdAt: string;
};