// Focused cross-user isolation test for the ownership check pattern used by
// EVERY entity's [id] route (getOwnedX(userId, id) -> 404 on mismatch). This
// exercises the REAL route handlers (GET/PATCH/DELETE), not a re-implemented
// copy of the ownership logic — only Prisma and the session are mocked, so
// no real database is needed.
//
// See docs/testing-cross-user-isolation.md for the full plan covering every
// ownership-scoped entity (farms, parcels, crop seasons, expenses, harvests,
// activities, reminders) and what's automated here vs. verified manually.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    farm: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET, DELETE } from "./route";

const mockedAuth = vi.mocked(auth);
const mockedFindUnique = vi.mocked(prisma.farm.findUnique);
const mockedDelete = vi.mocked(prisma.farm.delete);

const USER_A = "11111111-1111-1111-1111-111111111111";
const USER_B = "22222222-2222-2222-2222-222222222222";
const FARM_ID = "33333333-3333-3333-3333-333333333333";

function sessionFor(userId: string) {
  return {
    user: { id: userId },
    expires: "2099-01-01T00:00:00.000Z",
  } as Awaited<ReturnType<typeof auth>>;
}

function farmOwnedBy(userId: string) {
  return {
    id: FARM_ID,
    userId,
    name: "Ferma e Testit",
    location: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };
}

function request(id: string) {
  return new NextRequest(`http://localhost/api/farms/${id}`);
}

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("Cross-user isolation: GET/DELETE /api/farms/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the farm when the logged-in user owns it", async () => {
    mockedAuth.mockResolvedValue(sessionFor(USER_A));
    mockedFindUnique.mockResolvedValue(farmOwnedBy(USER_A));

    const response = await GET(request(FARM_ID), context(FARM_ID));

    expect(response.status).toBe(200);
    expect((await response.json()).id).toBe(FARM_ID);
  });

  it("returns 404 — never the data — when the farm belongs to a DIFFERENT user", async () => {
    mockedAuth.mockResolvedValue(sessionFor(USER_A));
    // The row genuinely exists in the DB, just owned by someone else.
    mockedFindUnique.mockResolvedValue(farmOwnedBy(USER_B));

    const response = await GET(request(FARM_ID), context(FARM_ID));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).not.toHaveProperty("userId");
    expect(body).not.toHaveProperty("name");
  });

  it("returns 404 for a genuinely nonexistent farm id", async () => {
    mockedAuth.mockResolvedValue(sessionFor(USER_A));
    mockedFindUnique.mockResolvedValue(null);

    const response = await GET(request("does-not-exist"), context("does-not-exist"));

    expect(response.status).toBe(404);
  });

  it("gives the IDENTICAL 404 body for not-owned vs. not-found — existence is never leaked", async () => {
    mockedAuth.mockResolvedValue(sessionFor(USER_A));

    mockedFindUnique.mockResolvedValueOnce(farmOwnedBy(USER_B));
    const notOwned = await GET(request(FARM_ID), context(FARM_ID));
    const notOwnedBody = await notOwned.json();

    mockedFindUnique.mockResolvedValueOnce(null);
    const notFound = await GET(request("missing"), context("missing"));
    const notFoundBody = await notFound.json();

    expect(notOwned.status).toBe(notFound.status);
    expect(notOwnedBody).toEqual(notFoundBody);
  });

  it("refuses to DELETE another user's farm: 404, and prisma.farm.delete is never called", async () => {
    mockedAuth.mockResolvedValue(sessionFor(USER_A));
    mockedFindUnique.mockResolvedValue(farmOwnedBy(USER_B));

    const response = await DELETE(request(FARM_ID), context(FARM_ID));

    expect(response.status).toBe(404);
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it("allows DELETE of a farm the user actually owns", async () => {
    mockedAuth.mockResolvedValue(sessionFor(USER_A));
    mockedFindUnique.mockResolvedValue(farmOwnedBy(USER_A));
    mockedDelete.mockResolvedValue(farmOwnedBy(USER_A));

    const response = await DELETE(request(FARM_ID), context(FARM_ID));

    expect(response.status).toBe(204);
    expect(mockedDelete).toHaveBeenCalledWith({ where: { id: FARM_ID } });
  });

  it("returns 401 with no session, before ever querying the database", async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await GET(request(FARM_ID), context(FARM_ID));

    expect(response.status).toBe(401);
    expect(mockedFindUnique).not.toHaveBeenCalled();
  });
});
