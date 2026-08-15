import { SignJWT, jwtVerify } from "jose";

const VERIFICATION_PURPOSE = "email-verification";
const PASSWORD_RESET_PURPOSE = "password-reset";

function getSecretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET);
}

export async function createVerificationToken(email: string) {
  return new SignJWT({ email, purpose: VERIFICATION_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecretKey());
}

export async function verifyVerificationToken(
  token: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.purpose !== VERIFICATION_PURPOSE ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}

// Shorter expiry than email verification — a password reset link is more
// sensitive, so it stays valid for less time.
export async function createPasswordResetToken(email: string) {
  return new SignJWT({ email, purpose: PASSWORD_RESET_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecretKey());
}

export async function verifyPasswordResetToken(
  token: string
): Promise<{ email: string; issuedAt: number } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      payload.purpose !== PASSWORD_RESET_PURPOSE ||
      typeof payload.email !== "string" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    return { email: payload.email, issuedAt: payload.iat * 1000 };
  } catch {
    return null;
  }
}
