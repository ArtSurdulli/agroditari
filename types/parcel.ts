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
};
