"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

const RegisterSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Fjalëkalimet nuk përputhen.",
    path: ["confirmPassword"],
  });

export type RegisterResult = { ok: boolean; error?: string };

export async function registerUser(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): Promise<RegisterResult> {
  const parsed = RegisterSchema.safeParse({
    name,
    email,
    password,
    confirmPassword,
  });
  if (!parsed.success) {
    const mismatch = parsed.error.issues.some(
      (issue) => issue.path[0] === "confirmPassword"
    );
    if (mismatch) {
      return { ok: false, error: "Fjalëkalimet nuk përputhen." };
    }
    return { ok: false, error: "Të dhëna të pavlefshme. Kontrolloni fushat." };
  }

  const { success } = await checkRateLimit(
    `register:${parsed.data.email}`,
    5,
    "60 s"
  );
  if (!success) {
    return { ok: false, error: "Shumë përpjekje. Provo më vonë." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { ok: false, error: "Ky email është i regjistruar tashmë" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: "farmer",
    },
  });

  const token = await createVerificationToken(parsed.data.email);
  const link = `${process.env.APP_URL}/verifo?token=${token}`;
  await sendVerificationEmail(parsed.data.email, link);
  await prisma.user.update({
    where: { email: parsed.data.email },
    data: { verificationSentAt: new Date() },
  });

  return { ok: true };
}