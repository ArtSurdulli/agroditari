import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import type { AdminStats } from "@/types/admin";

// System-wide counts for the admin overview page. Read-only, no ownership
// filter — this is the one place in the app that intentionally looks across
// every user's data, gated to admin/superadmin only.
export const GET = withApiHandler(async () => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const [totalUsers, totalFarms, totalParcels, totalSeasons] =
    await Promise.all([
      prisma.user.count(),
      prisma.farm.count(),
      prisma.parcel.count(),
      prisma.cropSeason.count(),
    ]);

  const stats: AdminStats = { totalUsers, totalFarms, totalParcels, totalSeasons };
  return NextResponse.json(stats);
});
