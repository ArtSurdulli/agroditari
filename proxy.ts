import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const isActive = session?.user?.status === "active";
  const path = nextUrl.pathname;
  const isAuthApi = path.startsWith("/api/auth");
  const isApi = path.startsWith("/api") && !isAuthApi;
  const isPublicPage =
    path === "/login" || path === "/register" || path.startsWith("/verifo");

  if (isAuthApi) return NextResponse.next();

  if (isApi) {
    if (!isLoggedIn || !isActive) {
      return NextResponse.json(
        { error: "Kërkohet verifikimi i email-it" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (isPublicPage) return NextResponse.next();

  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};