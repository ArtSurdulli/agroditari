"use client";

import { BottomNav } from "@/components/common/bottom-nav";
import { QuickAddDesktopButton, QuickAddFab } from "@/components/common/quick-add";
import { Sidebar } from "@/components/common/sidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";

type AppShellProps = {
  user?: {
    name?: string | null;
    email?: string | null;
  };
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  // Server always renders the mobile layout first; only trust the real
  // media query result after mount, mirroring the farms list pattern.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  return (
    <div className="flex min-h-screen bg-bg-page">
      {isDesktop && <Sidebar user={user} />}
      <div className="flex min-w-0 flex-1 flex-col">
        {isDesktop && (
          <div className="flex items-center justify-end border-b border-border bg-surface px-6 py-3">
            <QuickAddDesktopButton />
          </div>
        )}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        {!isDesktop && <BottomNav />}
        {!isDesktop && <QuickAddFab />}
      </div>
    </div>
  );
}