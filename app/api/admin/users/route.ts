import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/lib/api/response";
import { requireAdminSession } from "@/lib/admin/guard";
import type { AdminUser, AdminUserListResponse } from "@/types/admin";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: Date;
  _count: { farms: number };
}): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as AdminUser["role"],
    status: user.status as AdminUser["status"],
    farmCount: user._count.farms,
    createdAt: user.createdAt.toISOString(),
  };
}

// Malformed page/pageSize just fall back to sane defaults — this is a read
// endpoint, so a bad param behaves like "no param" instead of a 422.
function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = value ? Number.parseInt(value, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

// Lists users, paginated (100+ users shouldn't mean one giant unpaginated
// response) and searchable by name/email — no ownership filter (this is the
// admin section's whole purpose). `role` optionally narrows it (used by the
// superadmin-only "Manage Admins" page to show just admins).
export const GET = withApiHandler(async (request: NextRequest) => {
  const guard = await requireAdminSession();
  if (!guard.ok) return guard.response;

  const params = request.nextUrl.searchParams;
  const roleParam = params.get("role");
  const role =
    roleParam === "admin" || roleParam === "farmer" || roleParam === "superadmin"
      ? roleParam
      : undefined;
  const q = params.get("q")?.trim();
  const page = parsePositiveInt(params.get("page"), 1, Number.MAX_SAFE_INTEGER);
  const pageSize = parsePositiveInt(
    params.get("pageSize"),
    DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE
  );

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { farms: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const response: AdminUserListResponse = {
    users: users.map(serializeUser),
    total,
    page,
    pageSize,
  };
  return NextResponse.json(response);
});
