"use client";

import { useState } from "react";
import Link from "next/link";
import { Tractor, Mail, MailCheck } from "lucide-react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const result = await requestPasswordReset(email);
    setMessage(result.message);
    setSent(true);
    setPending(false);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-page px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
            {sent ? (
              <MailCheck className="h-7 w-7 text-primary" strokeWidth={2} />
            ) : (
              <Tractor className="h-7 w-7 text-primary" strokeWidth={2} />
            )}
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-text-primary">
            AgroDitari
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Rivendos fjalëkalimin e llogarisë tënde.
          </p>
        </div>

        {sent ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-text-primary">{message}</p>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={pending}
              className="h-12 w-full rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              Dërgo linkun
            </button>
          </form>
        )}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-text-secondary">Ose</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-lg border border-primary text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
        >
          Kyçu
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-text-secondary">
        © 2026 AgroDitari. Të gjitha të drejtat e rezervuara.
      </p>
    </main>
  );
}