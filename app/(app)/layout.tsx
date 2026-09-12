import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/common/app-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return <AppShell user={session?.user}>{children}</AppShell>;
}