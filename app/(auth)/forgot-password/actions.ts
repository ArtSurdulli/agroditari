"use server";

import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const COOLDOWN_MS = 60 * 1000;

const GENERIC_MESSAGE =
  "Nëse llogaria ekziston, të dërguam një email për rivendosjen e fjalëkalimit.";

export async function requestPasswordReset(
  email: string
): Promise<{ message: string }> {
  const { success } = await checkRateLimit(
    `reset-request:${email}`,
    3,
    "1 h"
  );
  if (!success) {
    return { message: GENERIC_MESSAGE };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Anti-enumeration: never reveal whether the email exists or its status.
  if (!user || user.status !== "active") {
    return { message: GENERIC_MESSAGE };
  }

  if (
    user.passwordResetSentAt &&
    Date.now() - user.passwordResetSentAt.getTime() < COOLDOWN_MS
  ) {
    return { message: GENERIC_MESSAGE };
  }

  // Stamp before signing the token so a stale token's iat is always <= the
  // sentAt used to validate it later (see resetPassword's staleness check).
  await prisma.user.update({
    where: { email },
    data: { passwordResetSentAt: new Date() },
  });

  const token = await createPasswordResetToken(email);
  const link = `${process.env.APP_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, link);

  return { message: GENERIC_MESSAGE };
}