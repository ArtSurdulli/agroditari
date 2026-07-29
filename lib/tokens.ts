import { SignJWT, jwtVerify } from "jose";

const VERIFICATION_PURPOSE = "email-verification";

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
