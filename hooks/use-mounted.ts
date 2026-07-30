"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

// True only after the component has mounted on the client. Guards
// client-only values (like matchMedia results) so the first client render
// matches the server-rendered HTML exactly, avoiding a hydration mismatch.
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}