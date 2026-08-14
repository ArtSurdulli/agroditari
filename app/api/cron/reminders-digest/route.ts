// Weekly reminder digest — intended to be triggered by a Vercel Cron job
// (e.g. Mondays 07:00) once this project is deployed; the vercel.json
// schedule is added at deploy time, not here.
//
// Test locally by calling this route manually, e.g.:
//   curl "http://localhost:3000/api/cron/reminders-digest?secret=$CRON_SECRET"
// or with a header instead of the query param:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//     http://localhost:3000/api/cron/reminders-digest

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { sendReminderDigestEmail, type ReminderDigestItem } from "@/lib/email";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return request.nextUrl.searchParams.get("secret") === secret;
}

export const GET = withApiHandler(async (request: NextRequest) => {
  if (!isAuthorized(request)) {
    return apiError(401, "Nuk je i autorizuar.");
  }

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const weekEnd = new Date(today);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const reminders = await prisma.reminder.findMany({
    where: {
      isDone: false,
      dueDate: { lte: weekEnd },
    },
    include: {
      user: { select: { email: true, name: true } },
      cropSeason: {
        select: {
          parcel: { select: { name: true } },
          crop: { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const byUser = new Map<
    string,
    {
      user: { email: string; name: string };
      overdue: ReminderDigestItem[];
      dueThisWeek: ReminderDigestItem[];
    }
  >();

  for (const reminder of reminders) {
    let entry = byUser.get(reminder.userId);
    if (!entry) {
      entry = { user: reminder.user, overdue: [], dueThisWeek: [] };
      byUser.set(reminder.userId, entry);
    }

    const item: ReminderDigestItem = {
      title: reminder.title,
      dueDate: reminder.dueDate,
      cropName: reminder.cropSeason?.crop.name ?? null,
      parcelName: reminder.cropSeason?.parcel.name ?? null,
    };

    if (reminder.dueDate < today) {
      entry.overdue.push(item);
    } else {
      entry.dueThisWeek.push(item);
    }
  }

  let emailsSent = 0;
  // Sequential (not Promise.all) so this never hammers SMTP — fine at
  // thesis scale.
  for (const entry of byUser.values()) {
    await sendReminderDigestEmail(entry.user, {
      overdue: entry.overdue,
      dueThisWeek: entry.dueThisWeek,
    });
    emailsSent += 1;
  }

  return NextResponse.json({ usersNotified: byUser.size, emailsSent });
});
