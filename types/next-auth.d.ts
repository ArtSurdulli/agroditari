import { DefaultSession } from "next-auth";

export type UserRole = "superadmin" | "admin" | "farmer";
export type UserAccountStatus = "pending" | "active" | "disabled";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      status: UserAccountStatus;
    } & DefaultSession["user"];
  }
  interface User {
    role: UserRole;
    status: UserAccountStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: UserRole;
    status: UserAccountStatus;
  }
}

// next-auth re-exports JWT from @auth/core/jwt, and @auth/core's own
// callback types import JWT from there directly — augmenting only
// "next-auth/jwt" doesn't reach that internal reference, so it's repeated
// here for the callback signatures to actually pick up the added fields.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role: UserRole;
    status: UserAccountStatus;
  }
}