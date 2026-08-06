"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

type BackButtonProps = {
  // Where to go if there's no in-app history to go back to (e.g. the user
  // opened the detail page directly from a URL, not by navigating here).
  fallbackHref: string;
  label?: string;
};

export function BackButton({ fallbackHref, label = "Kthehu" }: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-4 flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}