import type { seasonStatusValues } from "@/lib/validations/crop-season";

// Client-side shape of a CropSeason as it arrives over JSON. Ownership is
// three hops away (CropSeason -> Parcel -> Farm -> User), so the parcel and
// farm names are included here for display.
export type CropSeason = {
  id: string;
  parcelId: string;
  parcelName: string;
  farmName: string;
  cropId: string;
  cropName: string;
  season: string;
  status: (typeof seasonStatusValues)[number];
  sowingDate: string | null;
  expectedHarvestDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Row-summary rollups, present only on the list endpoint
  // (GET /api/crop-seasons) — undefined elsewhere (create/update responses).
  totalExpenses?: number;
  totalRevenue?: number;
};