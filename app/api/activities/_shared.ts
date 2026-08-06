export const activityInclude = {
  cropSeason: {
    select: {
      season: true,
      parcel: { select: { name: true } },
      crop: { select: { name: true } },
    },
  },
} as const;

export function serializeActivity(activity: {
  id: string;
  cropSeasonId: string;
  activityType: string;
  date: Date;
  notes: string | null;
  createdAt: Date;
  cropSeason: {
    season: string;
    parcel: { name: string };
    crop: { name: string };
  };
}) {
  return {
    id: activity.id,
    cropSeasonId: activity.cropSeasonId,
    season: activity.cropSeason.season,
    cropName: activity.cropSeason.crop.name,
    parcelName: activity.cropSeason.parcel.name,
    activityType: activity.activityType,
    date: activity.date,
    notes: activity.notes,
    createdAt: activity.createdAt,
  };
}