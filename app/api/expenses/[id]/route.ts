import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { validate } from "@/lib/validations";
import { expenseBaseSchema } from "@/lib/validations/expense";

type RouteContext = { params: Promise<{ id: string }> };

const AMOUNT_TOLERANCE = 0.01;

function serializeExpense(expense: {
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

const expenseInclude = {
  cropSeason: {
    select: {
      season: true,
      parcel: { select: { name: true } },
      crop: { select: { name: true } },
    },
  },
} as const;

// Loads an expense with its season -> parcel -> farm and confirms four-hop
// ownership (expense -> cropSeason -> parcel -> farm -> user) in one step.
// Callers must treat "not found" and "not owned" identically (404) so
// existence is never leaked.
async function getOwnedExpense(userId: string, id: string) {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: {
      cropSeason: {
        include: {
          parcel: { include: { farm: true } },
          crop: true,
        },
      },
    },
  });
  if (!expense || expense.cropSeason.parcel.farm.userId !== userId) {
    return null;
  }
  return expense;
}

export const GET = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const expense = await getOwnedExpense(session.user.id, id);
    if (!expense) {
      return apiError(404, "Shpenzimi nuk u gjet.");
    }

    return NextResponse.json(serializeExpense(expense));
  }
);

export const PATCH = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedExpense(session.user.id, id);
    if (!existing) {
      return apiError(404, "Shpenzimi nuk u gjet.");
    }

    const body = await request.json();
    const result = validate(expenseBaseSchema.partial(), body);
    if (!result.success) {
      return apiError(422, "Të dhëna të pavlefshme.", result.errors);
    }

    // If the season is being changed, verify the NEW season is also owned by
    // the current user before allowing the move.
    if (
      result.data.cropSeasonId !== undefined &&
      result.data.cropSeasonId !== existing.cropSeasonId
    ) {
      const newSeason = await prisma.cropSeason.findUnique({
        where: { id: result.data.cropSeasonId },
        include: { parcel: { include: { farm: true } } },
      });
      if (!newSeason || newSeason.parcel.farm.userId !== session.user.id) {
        return apiError(404, "Sezoni nuk u gjet.");
      }
    }

    // Cross-field amount = quantity × unitPrice validation has to run against
    // the merged existing + incoming record, since a partial payload may only
    // touch one of the three fields.
    const nextQuantity =
      result.data.quantity !== undefined
        ? result.data.quantity
        : existing.quantity !== null
          ? Number(existing.quantity)
          : undefined;
    const nextUnitPrice =
      result.data.unitPrice !== undefined
        ? result.data.unitPrice
        : existing.unitPrice !== null
          ? Number(existing.unitPrice)
          : undefined;
    const nextAmount =
      result.data.amount !== undefined
        ? result.data.amount
        : Number(existing.amount);

    if (nextQuantity !== undefined && nextUnitPrice !== undefined) {
      const expected = nextQuantity * nextUnitPrice;
      if (Math.abs(expected - nextAmount) > AMOUNT_TOLERANCE) {
        return apiError(422, "Të dhëna të pavlefshme.", {
          amount: "Shuma duhet të jetë e barabartë me sasinë herë çmimin.",
        });
      }
    }

    const data: Prisma.ExpenseUncheckedUpdateInput = {};
    if (result.data.cropSeasonId !== undefined) {
      data.cropSeasonId = result.data.cropSeasonId;
    }
    if (result.data.category !== undefined) {
      data.category = result.data.category;
    }
    if (result.data.description !== undefined) {
      data.description =
        result.data.description === "" ? null : result.data.description;
    }
    if (result.data.quantity !== undefined) {
      data.quantity = result.data.quantity;
    }
    if (result.data.unitPrice !== undefined) {
      data.unitPrice = result.data.unitPrice;
    }
    if (result.data.amount !== undefined) {
      data.amount = result.data.amount;
    }
    if (result.data.date !== undefined) {
      data.date = new Date(result.data.date);
    }

    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: expenseInclude,
    });

    return NextResponse.json(serializeExpense(expense));
  }
);

export const DELETE = withApiHandler(
  async (request: NextRequest, { params }: RouteContext) => {
    const session = await auth();
    if (!session?.user) {
      return apiError(401, "Kërkohet identifikimi.");
    }

    const { id } = await params;
    const existing = await getOwnedExpense(session.user.id, id);
    if (!existing) {
      return apiError(404, "Shpenzimi nuk u gjet.");
    }

    await prisma.expense.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  }
);