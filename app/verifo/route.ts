import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyVerificationToken } from "@/lib/tokens";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  const email = token ? await verifyVerificationToken(token) : null;
  if (!email) {
    return NextResponse.redirect(
      new URL("/login?error=verifikimi_deshtoi", request.url)
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=verifikimi_deshtoi", request.url)
    );
  }

  // Only a `pending` account is activated by clicking the link. A `disabled`
  // account was deactivated by an admin — an old/reused verification link
  // must NOT undo that; only an admin can bring it back to active.
  if (user.status === "disabled") {
    return NextResponse.redirect(new URL("/login?disabled=1", request.url));
  }

  if (user.status === "pending") {
    await prisma.user.update({
      where: { email },
      data: { status: "active", emailVerifiedAt: new Date() },
    });
  }

  return NextResponse.redirect(new URL("/login?verified=1", request.url));
}
