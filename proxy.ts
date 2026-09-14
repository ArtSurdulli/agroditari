import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const ADMIN_ROLES = new Set(["admin", "superadmin"]);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const isActive = session?.user?.status === "active";
  const isAdminRole = !!session?.user?.role && ADMIN_ROLES.has(session.user.role);
  const path = nextUrl.pathname;
  const isAuthApi = path.startsWith("/api/auth");
  // Cron endpoints have no user session (Vercel Cron calls them directly) —
  // each one guards itself with its own secret check instead.
  const isCronApi = path.startsWith("/api/cron");
  const isApi = path.startsWith("/api") && !isAuthApi && !isCronApi;
  const isAdminApi = path.startsWith("/api/admin");
  const isAdminPage = path.startsWith("/admin");
  const isPublicPage =
    path === "/" ||
    path === "/login" ||
    path === "/register" ||
    path.startsWith("/verifo") ||
    path === "/forgot-password" ||
    path === "/reset-password";

  if (isAuthApi) return NextResponse.next();

  if (isApi) {
    if (!isLoggedIn || !isActive) {
      return NextResponse.json(
        { error: "Kërkohet verifikimi i email-it" },
        { status: 401 }
      );
    }
    // Role gate, on top of the auth/active check above — every /api/admin/*
    // route also re-checks this itself (defense in depth).
    if (isAdminApi && !isAdminRole) {
      return NextResponse.json({ error: "Nuk keni akses." }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (isPublicPage) return NextResponse.next();

  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", nextUrl));

  // Farmers never see /admin — sent back to their own dashboard instead of a
  // 403 page, since this is a normal nav miss, not an attack to flag loudly.
  if (isAdminPage && !isAdminRole) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};