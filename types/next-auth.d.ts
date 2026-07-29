import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      status: "pending" | "active";
    } & DefaultSession["user"];
  }
  interface User {
    role: string;
    status: "pending" | "active";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role: string;
    status: "pending" | "active";
  }
}

// next-auth re-exports JWT from @auth/core/jwt, and @auth/core's own
// callback types import JWT from there directly — augmenting only
// "next-auth/jwt" doesn't reach that internal reference, so it's repeated
// here for the callback signatures to actually pick up the added fields.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role: string;
    status: "pending" | "active";
  }
}