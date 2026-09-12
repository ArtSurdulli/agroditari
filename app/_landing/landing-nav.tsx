import Link from "next/link";
import { Tractor } from "lucide-react";

const sectionLinks = [
  { href: "#vecorite", label: "Veçoritë" },
  { href: "#si-funksionon", label: "Si funksionon" },
  { href: "#pse-agroditari", label: "Pse ne" },
];

type LandingNavProps = {
  isLoggedIn: boolean;
};

export function LandingNav({ isLoggedIn }: LandingNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light">
            <Tractor className="h-5 w-5 text-primary" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold text-text-primary">
            AgroDitari
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {sectionLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Shko te paneli
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-page sm:px-4"
              >
                Hyr
              </Link>
              <Link
                href="/register"
                className="flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark sm:px-4"
              >
                Regjistrohu
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
