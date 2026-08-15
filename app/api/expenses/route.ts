import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { validate } from "@/lib/validations";
import {
  expenseBaseSchema,
  expenseCategoryValues,
  expenseSchema,
} from "@/lib/validations/expense";
import { expenseInclude, serializeExpense } from "./_shared";

export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const cropSeasonIdParam = request.nextUrl.searchParams
    .get("cropSeasonId")
    ?.trim();
  const categoryParam = request.nextUrl.searchParams.get("category")?.trim();

  // Guard both optional filters against malformed values reaching Prisma —
  // cropSeasonId is a Postgres uuid column, category a Postgres enum column,
  // and an invalid literal for either throws a raw DB error instead of
  // failing validation gracefully.
  const cropSeasonId =
    cropSeasonIdParam &&
    expenseBaseSchema.shape.cropSeasonId.safeParse(cropSeasonIdParam).success
      ? cropSeasonIdParam
      : undefined;
  const category =
    categoryParam &&
    (expenseCategoryValues as readonly string[]).includes(categoryParam)
      ? (categoryParam as (typeof expenseCategoryValues)[number])
      : undefined;

  const expenses = await prisma.expense.findMany({
    where: {
      // Four-hop ownership: an expense is only visible if its season's
      // parcel's farm belongs to the current user — there is no direct
      // userId on Expense.
      cropSeason: { parcel: { farm: { userId: session.user.id } } },
      ...(cropSeasonId ? { cropSeasonId } : {}),
      ...(category ? { category } : {}),
    },
    include: expenseInclude,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses.map(serializeExpense));
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const { success: rateLimitOk } = await checkRateLimit(
    `expense-create:${session.user.id}`,
    20,
    "60 s"
  );
  if (!rateLimitOk) {
    return apiError(429, "Shumë përpjekje. Provo më vonë.");
  }

  const body = await request.json();
  const result = validate(expenseSchema, body);
  if (!result.success) {
    return apiError(422, "Të dhëna të pavlefshme.", result.errors);
  }

  // Verify the given season belongs to the current user before creating the
  // expense under it — never reveal that a season exists if it isn't theirs.
  const season = await prisma.cropSeason.findUnique({
    where: { id: result.data.cropSeasonId },
    include: { parcel: { include: { farm: true } } },
  });
  if (!season || season.parcel.farm.userId !== session.user.id) {
    return apiError(404, "Sezoni nuk u gjet.");
  }

  const expense = await prisma.expense.create({
    data: {
      cropSeasonId: result.data.cropSeasonId,
      category: result.data.category,
      description: result.data.description || null,
      quantity: result.data.quantity ?? null,
      unitPrice: result.data.unitPrice ?? null,
      amount: result.data.amount,
      date: new Date(result.data.date),
    },
    include: expenseInclude,
  });

  return NextResponse.json(serializeExpense(expense), { status: 201 });
});