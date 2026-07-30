import { auth } from "@/auth";
import { AppShell } from "@/components/common/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return <AppShell user={session?.user}>{children}</AppShell>;
}