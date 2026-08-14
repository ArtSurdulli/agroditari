"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LogOut, Tractor } from "lucide-react";
import { signOutAction } from "@/app/(app)/actions";
import { useMounted } from "@/hooks/use-mounted";
import { useReminders } from "@/hooks/use-reminders";
import { navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "agroditari:sidebar-collapsed";

// Local calendar date, matching the same "today" definition used on the
// reminders page (dueDate is a plain calendar date, not a timestamp).
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

type SidebarProps = {
  user?: {
    name?: string | null;
    email?: string | null;
  };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const mounted = useMounted();
  const [storedCollapsed, setStoredCollapsed] = useState(() =>
    getStoredCollapsed()
  );

  // Before mount, always render expanded so the first client paint matches
  // the server-rendered HTML exactly (avoids a hydration mismatch); the
  // persisted preference takes effect once mounted is true.
  const collapsed = mounted && storedCollapsed;

  // Count of not-done reminders that are due today or overdue, shown as a
  // small badge on the "Kujtesa" nav item.
  const { data: pendingReminders } = useReminders({ done: false });
  const today = todayStr();
  const dueSoonCount = (pendingReminders ?? []).filter(
    (reminder) => reminder.dueDate.slice(0, 10) <= today
  ).length;

  function toggleCollapsed() {
    setStoredCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
          <Tractor className="h-5 w-5 text-primary" strokeWidth={2} />
        </div>
        {!collapsed && (
          <span className="truncate text-lg font-semibold text-text-primary">
            AgroDitari
          </span>
        )}
      </div>

      <div className="border-b border-border p-3">
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Zgjero anën" : "Mbyll anën"}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg py-2 text-sm text-text-secondary hover:bg-bg-page",
            collapsed ? "justify-center px-0" : "px-3"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Mbyll</span>
            </>
          )}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-[3px] border-transparent px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-page",
                collapsed && "justify-center px-0"
              )}
              style={
                isActive
                  ? {
                      backgroundColor: item.color.tint,
                      borderLeftColor: item.color.border,
                      color: item.color.textStrong,
                    }
                  : undefined
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">{item.label}</span>
                  {item.href === "/reminders" && dueSoonCount > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-danger px-1.5 text-xs font-medium text-white">
                      {dueSoonCount}
                    </span>
                  )}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {!collapsed && (user?.name || user?.email) && (
          <div className="mb-2 px-1">
            {user?.name && (
              <p className="truncate text-sm font-medium text-text-primary">
                {user.name}
              </p>
            )}
            {user?.email && (
              <p className="truncate text-xs text-text-secondary">
                {user.email}
              </p>
            )}
          </div>
        )}

        <form action={signOutAction}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-danger-light hover:text-danger",
              collapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Dil</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}