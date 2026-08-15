// Client-side shape of a Reminder as it arrives over JSON. Ownership is
// direct (Reminder.userId), the simplest case, like farms. The linked
// crop-season (if any) is optional, so its season/crop/parcel labels are
// included here only when cropSeasonId is set.
export type Reminder = {
  id: string;
  userId: string;
  cropSeasonId: string | null;
  season: string | null;
  cropName: string | null;
  parcelName: string | null;
  title: string;
  description: string | null;
  dueDate: string;
  isDone: boolean;
  createdAt: string;
};