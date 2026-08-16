# Cross-user isolation — test plan and status

AgroDitari has no direct authorization roles; every entity is scoped to the
logged-in user purely by ownership. Chapter 6 requires proof that a user
cannot see or modify another user's data. This document lists every
ownership-scoped entity, the exact check each one runs, and which of those
checks are automated vs. verified manually today.

## The pattern

Every `[id]` API route follows the same shape (see `AGENTS.md` §4 "Ownership
control"): a `getOwnedX(userId, id)` helper loads the row and returns `null`
unless the ownership chain resolves to the current user, and the route
returns **404** either way — a non-owned row and a non-existent row are
indistinguishable to the caller, so existence is never leaked (never 403).

| Entity | Route | Ownership check | Hops |
|---|---|---|---|
| Farm | `app/api/farms/[id]/route.ts` | `farm.userId !== userId` | 1 (direct) |
| Parcel | `app/api/parcels/[id]/route.ts` | `parcel.farm.userId !== userId` | 2 |
| CropSeason | `app/api/crop-seasons/[id]/route.ts` | `season.parcel.farm.userId !== userId` | 3 |
| Expense | `app/api/expenses/[id]/route.ts` | `expense.cropSeason.parcel.farm.userId !== userId` | 4 |
| Harvest | `app/api/harvests/[id]/route.ts` | `harvest.cropSeason.parcel.farm.userId !== userId` | 4 |
| Activity | `app/api/activities/[id]/route.ts` | `activity.cropSeason.parcel.farm.userId !== userId` | 4 |
| Reminder | `app/api/reminders/[id]/route.ts` | `reminder.userId !== userId` | 1 (direct) |

List endpoints (`GET /api/parcels`, `GET /api/expenses`, etc.) apply the same
chain as a Prisma `where` filter instead of a per-row check (e.g.
`cropSeason: { parcel: { farm: { userId } } } }` for expenses) — same
guarantee, different shape, not separately re-tested here.

## Automated

`app/api/farms/[id]/route.test.ts` exercises the **real** `GET`/`DELETE`
route handlers (only `@/auth` and `@/lib/prisma` are mocked — no real
database) and asserts:

- a farm owned by the logged-in user is returned normally;
- a farm that **exists but belongs to a different user** returns 404 and
  none of its fields;
- a farm that doesn't exist at all also returns 404;
- the two 404 responses are **byte-identical** (existence is never leaked
  through a different error message or status);
- `DELETE` on another user's farm returns 404 and `prisma.farm.delete` is
  **never called** (the mutation genuinely doesn't run, not just "the
  response looks right");
- a request with no session is rejected (401) before Prisma is even queried.

This is the one entity chosen for full automation because it's the shallowest
case (1-hop, no nested `include`) and the pattern is otherwise identical for
every other entity below — duplicating the same six tests six more times
with deeper mock fixtures would test the same `!== userId` branch, not new
behavior.

## Not yet duplicated as automated tests

Parcel, CropSeason, Expense, Harvest, Activity: same `getOwnedX` pattern as
farms, just with a longer `include` chain and a different final `.userId`
access path (see table above). Extending `route.test.ts`'s approach to these
is mechanical — mock the corresponding `prisma.<entity>.findUnique` to
resolve an object whose ownership hop belongs to `USER_B`, assert 404. Left
as follow-up work rather than done here to avoid ~30 near-duplicate tests
that all assert the same inequality check at different nesting depths.

Reminder: same 1-hop direct-`userId` shape as Farm; lowest-risk of the
untested group.

## Manual verification (until the above is extended)

`prisma/seed-test.ts` (gitignored, local-only) seeds one full farm → parcel →
season → expenses/harvests chain for `test@agroditari.com`. To manually
verify isolation for any entity not yet covered above:

1. Run `npm run seed:test` to create the test user and its data, note one of
   the created ids (e.g. a parcel id) from the script output or a DB client.
2. Log in as a **second**, different user.
3. Hit `GET /api/<entity>/<id>` (or the equivalent detail page,
   e.g. `/parcels/<id>`) using that second user's session, with the id that
   belongs to the test user.
4. Confirm: HTTP 404 (page: the Next.js not-found page), and confirm no
   field of the target row appears anywhere in the response/page.
5. Repeat for `PATCH`/`DELETE` (or the edit/delete UI) — confirm the write
   is rejected (404) and, if checkable, that the row is unchanged in the DB.

This is a real, if manual, check of production code and data — it is the
process used while building the farm/parcel detail pages, and can be
re-run and cited as such in Chapter 6.
