export const parcelInclude = {
  farm: { select: { name: true } },
} as const;

export function serializeParcel(parcel: {
  id: string;
  farmId: string;
  name: string;
  areaHa: unknown;
  soilType: string | null;
  createdAt: Date;
  updatedAt: Date;
  farm: { name: string };
}) {
  return {
    id: parcel.id,
    farmId: parcel.farmId,
    farmName: parcel.farm.name,
    name: parcel.name,
    areaHa: parcel.areaHa,
    soilType: parcel.soilType,
    createdAt: parcel.createdAt,
    updatedAt: parcel.updatedAt,
  };
}