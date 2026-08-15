import type { activityTypeValues } from "@/lib/validations/activity";

// Client-side shape of an Activity as it arrives over JSON. Ownership is four
// hops away (Activity -> CropSeason -> Parcel -> Farm -> User), so the season
// label, crop name, and parcel name are included here for display.
export type Activity = {
  id: string;
  cropSeasonId: string;
  season: string;
  cropName: string;
  parcelName: string;
  activityType: (typeof activityTypeValues)[number];
  date: string;
  notes: string | null;
  createdAt: string;
};