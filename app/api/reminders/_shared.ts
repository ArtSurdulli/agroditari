export const reminderInclude = {
  cropSeason: {
    select: {
      season: true,
      parcel: { select: { name: true } },
      crop: { select: { name: true } },
    },
  },
} as const;

export function serializeReminder(reminder: {
  id: string;
  userId: string;
  cropSeasonId: string | null;
  title: string;
  description: string | null;
  dueDate: Date;
  isDone: boolean;
  createdAt: Date;
  cropSeason: {
    season: string;
    parcel: { name: string };
    crop: { name: string };
  } | null;
}) {
  return {
    id: reminder.id,
    userId: reminder.userId,
    cropSeasonId: reminder.cropSeasonId,
    season: reminder.cropSeason?.season ?? null,
    cropName: reminder.cropSeason?.crop.name ?? null,
    parcelName: reminder.cropSeason?.parcel.name ?? null,
    title: reminder.title,
    description: reminder.description,
    dueDate: reminder.dueDate,
    isDone: reminder.isDone,
    createdAt: reminder.createdAt,
  };
}
