// Client-side shape of a Parcel as it arrives over JSON (Decimal serializes
// as a string, dates as ISO strings). Includes the parent farm's name for
// display since ownership is two hops away (Parcel -> Farm -> User).
export type Parcel = {
  id: string;
  farmId: string;
  farmName: string;
  name: string;
  areaHa: string;
  soilType: string | null;
  createdAt: string;
  updatedAt: string;
  // Row-summary rollups, present only on the list endpoint (GET /api/parcels)
  // — undefined elsewhere (create/update/detail responses).
  seasonCount?: number;
  activeSeasonCount?: number;
  // The active season's crop, or the most recently created season's crop if
  // none is active; null when the parcel has no seasons at all.
  currentCropName?: string | null;
};
