"use client";

import { useEffect, useState } from "react";

function getMatches(query: string): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => getMatches(query));
  const [trackedQuery, setTrackedQuery] = useState(query);

  // Query changed since the last render: adjust state during render
  // (React's recommended alternative to setState-in-effect) instead of
  // waiting for the next "change" event, which may never fire.
  if (query !== trackedQuery) {
    setTrackedQuery(query);
    setMatches(getMatches(query));
  }

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}