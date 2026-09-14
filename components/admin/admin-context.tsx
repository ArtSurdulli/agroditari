"use client";

import { createContext, useContext } from "react";
import type { AdminRole } from "@/lib/admin-theme";

type AdminSessionValue = { role: AdminRole; userId: string };

const AdminContext = createContext<AdminSessionValue | null>(null);

export function AdminSessionProvider({
  value,
  children,
}: {
  value: AdminSessionValue;
  children: React.ReactNode;
}) {
  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

// Lets any client component under /admin read the current admin's role
// (for theming) and id (to disable "act on yourself" buttons) without
// prop-drilling through every page.
export function useAdminSession(): AdminSessionValue {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdminSession must be used within AdminSessionProvider");
  }
  return ctx;
}
