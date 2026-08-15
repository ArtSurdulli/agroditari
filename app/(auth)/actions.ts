"use server";

import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const COOLDOWN_MS = 60 * 1000;

const GENERIC_SUCCESS = {
  ok: true,
  message:
    "Nëse llogaria ekziston dhe s'është e verifikuar, të dërguam një email.",
};

export async function resendVerification(
  email: string
): Promise<{ ok: boolean; message: string }> {
  const { success } = await checkRateLimit(`resend:${email}`, 3, "1 h");
  if (!success) {
    return GENERIC_SUCCESS;
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.status === "active") {
    return GENERIC_SUCCESS;
  }

  if (
    user.verificationSentAt &&
    Date.now() - user.verificationSentAt.getTime() < COOLDOWN_MS
  ) {
    return { ok: false, message: "Prit pak para se të kërkosh sërish." };
  }

  const token = await createVerificationToken(email);
  const link = `${process.env.APP_URL}/verifo?token=${token}`;
  await sendVerificationEmail(email, link);
  await prisma.user.update({
    where: { email },
    data: { verificationSentAt: new Date() },
  });

  return GENERIC_SUCCESS;
}