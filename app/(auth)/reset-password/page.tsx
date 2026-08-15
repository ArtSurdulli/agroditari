"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Tractor, Lock, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "./actions";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Linku është i pavlefshëm. Kërko një link të ri.");
      return;
    }

    setPending(true);
    const result = await resetPassword(token, password, confirmPassword);

    if (!result.ok) {
      setError(result.error ?? "Diçka shkoi keq.");
      setPending(false);
      return;
    }

    window.location.href = "/login?reset=1";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
            <Tractor className="h-7 w-7 text-primary" strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-text-primary">
            AgroDitari
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Vendos një fjalëkalim të ri.
          </p>
        </div>

        {!token ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-danger">
              Linku është i pavlefshëm ose ka skaduar.
            </p>
            <Link
              href="/forgot-password"
              className="flex h-12 w-full items-center justify-center rounded-lg border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              Kërko një link të ri
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-semibold text-text-primary"
              >
                Fjalëkalimi i ri
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-lg border border-border bg-surface pl-11 pr-11 text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label={
                    showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-semibold text-text-primary"
              >
                Konfirmo fjalëkalimin
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="h-12 w-full rounded-lg border border-border bg-surface pl-11 pr-11 text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  aria-label={
                    showConfirmPassword
                      ? "Fshih fjalëkalimin"
                      : "Shfaq fjalëkalimin"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              Ndrysho fjalëkalimin
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-text-secondary">
        © 2026 AgroDitari. Të gjitha të drejtat e rezervuara.
      </p>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}