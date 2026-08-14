export const harvestInclude = {
  cropSeason: {
    select: {
      season: true,
      parcel: { select: { name: true } },
      crop: { select: { name: true } },
    },
  },
} as const;

export function serializeHarvest(harvest: {
  id: string;
  cropSeasonId: string;
  quantity: unknown;
  unit: string;
  unitPrice: unknown;
  revenue: unknown;
  date: Date;
  createdAt: Date;
  cropSeason: {
    season: string;
    parcel: { name: string };
    crop: { name: string };
  };
}) {
  return {
    id: harvest.id,
    cropSeasonId: harvest.cropSeasonId,
    season: harvest.cropSeason.season,
    cropName: harvest.cropSeason.crop.name,
    parcelName: harvest.cropSeason.parcel.name,
    quantity: harvest.quantity,
    unit: harvest.unit,
    unitPrice: harvest.unitPrice,
    revenue: harvest.revenue,
    date: harvest.date,
    createdAt: harvest.createdAt,
  };
}