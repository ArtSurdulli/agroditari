export const expenseInclude = {
  cropSeason: {
    select: {
      season: true,
      parcel: { select: { name: true } },
      crop: { select: { name: true } },
    },
  },
} as const;

export function serializeExpense(expense: {
  id: string;
  cropSeasonId: string;
  category: string;
  description: string | null;
  quantity: unknown;
  unitPrice: unknown;
  amount: unknown;
  date: Date;
  createdAt: Date;
  cropSeason: {
    season: string;
    parcel: { name: string };
    crop: { name: string };
  };
}) {
  return {
    id: expense.id,
    cropSeasonId: expense.cropSeasonId,
    season: expense.cropSeason.season,
    cropName: expense.cropSeason.crop.name,
    parcelName: expense.cropSeason.parcel.name,
    category: expense.category,
    description: expense.description,
    quantity: expense.quantity,
    unitPrice: expense.unitPrice,
    amount: expense.amount,
    date: expense.date,
    createdAt: expense.createdAt,
  };
}