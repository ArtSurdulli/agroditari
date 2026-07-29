import { Tractor } from "lucide-react";
import { auth, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light">
            <Tractor className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold text-text-primary">
            AgroDitari
          </span>
        </div>
        <form action={handleSignOut}>
          <button
            type="submit"
            className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-page"
          >
            Dil
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-text-primary">
          Mirë se erdhe, {session?.user?.name}
        </h1>
      </main>
    </div>
  );
}