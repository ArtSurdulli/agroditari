export const seasonInclude = {
  parcel: { select: { name: true, farm: { select: { name: true } } } },
  crop: { select: { name: true } },
} as const;

export function serializeCropSeason(season: {
  id: string;
  parcelId: string;
  cropId: string;
  season: string;
  status: string;
  sowingDate: Date | null;
  expectedHarvestDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  parcel: { name: string; farm: { name: string } };
  crop: { name: string };
}) {
  return {
    id: season.id,
    parcelId: season.parcelId,
    parcelName: season.parcel.name,
    farmName: season.parcel.farm.name,
    cropId: season.cropId,
    cropName: season.crop.name,
    season: season.season,
    status: season.status,
    sowingDate: season.sowingDate,
    expectedHarvestDate: season.expectedHarvestDate,
    createdAt: season.createdAt,
    updatedAt: season.updatedAt,
  };
}