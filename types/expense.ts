import type { expenseCategoryValues } from "@/lib/validations/expense";

// Client-side shape of an Expense as it arrives over JSON (Decimal
// serializes as a string). Ownership is four hops away (Expense -> CropSeason
// -> Parcel -> Farm -> User), so the season label, crop name, and parcel name
// are included here for display.
export type Expense = {
  id: string;
  cropSeasonId: string;
  season: string;
  cropName: string;
  parcelName: string;
  category: (typeof expenseCategoryValues)[number];
  description: string | null;
  quantity: string | null;
  unitPrice: string | null;
  amount: string;
  date: string;
  createdAt: string;
};
