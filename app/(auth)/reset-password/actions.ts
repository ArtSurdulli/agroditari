"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken } from "@/lib/tokens";
import { PasswordSchema } from "@/lib/validations";

const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Fjalëkalimet nuk përputhen.",
    path: ["confirmPassword"],
  });

const INVALID_LINK_ERROR =
  "Linku ka skaduar ose është i pavlefshëm. Kërko një link të ri.";

// Tolerance for comparing the token's (second-precision) iat against the
// user's (millisecond-precision) passwordResetSentAt.
const TOKEN_STALENESS_TOLERANCE_MS = 5000;

export type ResetPasswordResult = { ok: boolean; error?: string };

export async function resetPassword(
  token: string,
  password: string,
  confirmPassword: string
): Promise<ResetPasswordResult> {
  const verified = await verifyPasswordResetToken(token);
  if (!verified) {
    return { ok: false, error: INVALID_LINK_ERROR };
  }

  const parsed = ResetPasswordSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find(
      (issue) => issue.path[0] === "password"
    );
    if (passwordIssue) {
      return { ok: false, error: passwordIssue.message };
    }
    return { ok: false, error: "Fjalëkalimet nuk përputhen." };
  }

  const user = await prisma.user.findUnique({
    where: { email: verified.email },
  });
  if (!user) {
    return { ok: false, error: INVALID_LINK_ERROR };
  }

  // A newer reset (request or a prior successful use) invalidates this
  // token — only the most recently issued link is accepted.
  if (
    !user.passwordResetSentAt ||
    verified.issuedAt <
      user.passwordResetSentAt.getTime() - TOKEN_STALENESS_TOLERANCE_MS
  ) {
    return { ok: false, error: INVALID_LINK_ERROR };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.update({
    where: { email: verified.email },
    data: {
      passwordHash,
      // Bump the marker so this same token can't be replayed.
      passwordResetSentAt: new Date(),
    },
  });

  return { ok: true };
}