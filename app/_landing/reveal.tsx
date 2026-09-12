"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
};

const HIDDEN_CLASSES = ["opacity-0", "translate-y-6"];

// useLayoutEffect only on the client to avoid the SSR "does nothing on the
// server" warning — Next.js server-renders this component's markup too.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Gentle fade/slide-up as a section enters the viewport. The server-rendered
// (and no-JS) markup is always fully visible — the hidden state is applied
// imperatively before first paint, so nothing ever depends on JS to become
// visible, and prefers-reduced-motion skips the effect entirely.
export function Reveal({ children, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    node.classList.add(...HIDDEN_CLASSES);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.remove(...HIDDEN_CLASSES);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out", className)}>
      {children}
    </div>
  );
}
