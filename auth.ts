import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { authConfig } from "./auth.config";

// Thrown (not just a null return) specifically for a `disabled` account, so
// the login page can tell it apart from "wrong password" / "not verified
// yet" and show a distinct message — the `code` survives to the client via
// signIn()'s returned `code` field. Deliberately reveals the account is
// disabled (accepted tradeoff); every other rejection stays a plain `null`
// return, which surfaces only the generic CredentialsSignin error.
class DisabledAccountSignin extends CredentialsSignin {
  code = "disabled";
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const { success } = await checkRateLimit(`login:${email}`, 5, "60 s");
        if (!success) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        // A disabled account is an admin action — surface it distinctly so
        // the user isn't told to just "verify your email" (which a pending
        // account is told, and which would let them think resending a
        // verification email could undo the admin's deactivation).
        if (user.status === "disabled") throw new DisabledAccountSignin();
        if (user.status !== "active") return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});