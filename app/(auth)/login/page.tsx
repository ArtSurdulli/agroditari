"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Tractor, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { resendVerification } from "../actions";

function LoginForm() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "1";
  const verificationFailed = searchParams.get("error") === "verifikimi_deshtoi";
  const resetSuccess = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResendMessage(null);
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
      redirect: false,
    });

    if (result?.error) {
      setError(
        "Email/fjalëkalim i gabuar, ose llogaria nuk është verifikuar ende."
      );
      setPending(false);
      return;
    }

    window.location.href = "/";
  }

  async function handleResend() {
    setResendPending(true);
    setResendMessage(null);
    const result = await resendVerification(email);
    setResendMessage(result.message);
    setResendPending(false);
    setResendCooldown(60);
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
            Menaxhimi i fermës tuaj, në pëllëmbë të dorës.
          </p>
        </div>

        {verified && (
          <p className="mt-6 rounded-lg bg-primary-light px-4 py-3 text-center text-sm font-semibold text-primary-dark">
            Email u verifikua. Tani mund të kyçesh.
          </p>
        )}

        {resetSuccess && (
          <p className="mt-6 rounded-lg bg-primary-light px-4 py-3 text-center text-sm font-semibold text-primary-dark">
            Fjalëkalimi u ndryshua. Tani mund të kyçesh.
          </p>
        )}

        {verificationFailed && (
          <p className="mt-6 rounded-lg bg-danger-light px-4 py-3 text-center text-sm font-semibold text-danger">
            Verifikimi dështoi. Provo përsëri ose regjistrohu sërish.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-text-primary"
            >
              Emaili
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="emri@ferma.com"
                className="h-12 w-full rounded-lg border border-border bg-surface pl-11 pr-4 text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-text-primary"
            >
              Fjalëkalimi
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            <div className="mt-1.5 text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary-dark"
              >
                Keni harruar fjalëkalimin?
              </Link>
            </div>
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-danger">{error}</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendPending || resendCooldown > 0 || !email}
                className="h-11 w-full rounded-lg border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary-light disabled:opacity-60"
              >
                {resendCooldown > 0
                  ? `Ridërgo email-in e verifikimit (${resendCooldown}s)`
                  : "Ridërgo email-in e verifikimit"}
              </button>
              {resendMessage && (
                <p className="text-sm text-text-secondary">{resendMessage}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="h-12 w-full rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            Kyçu
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-text-secondary">Ose</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/register"
          className="flex h-12 w-full items-center justify-center rounded-lg border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
        >
          Regjistrohu
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-text-secondary">
        © 2026 AgroDitari. Të gjitha të drejtat e rezervuara.
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}