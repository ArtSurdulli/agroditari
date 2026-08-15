"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Quick-add deep links (e.g. /farms?new=1, /seasons/[id]?new=expenses) open a
// create dialog on arrival, then strip the query param so a refresh doesn't
// reopen it. Requires a Suspense boundary above the caller (useSearchParams).
//
// Correct sequencing, in order:
//   1. Seed the open state from the flag so a FRESH navigation (the common
//      case) opens the dialog on first paint.
//   2. Compare the flag against a "last seen" value during render (adjusted
//      during render — React's recommended alternative to setState in an
//      effect) so the flag reappearing on an ALREADY-MOUNTED instance (the
//      client router reusing a page from an earlier visit) also opens it.
//   3. Clean up the URL in an effect, gated on the flag — never on `open`,
//      so closing the dialog manually never re-triggers a replace, and the
//      cleanup never closes a dialog the user (or step 1/2) just opened.
//
// `replacementSearch` (optional): the query string to replace the flag with
// during cleanup, instead of stripping to a bare pathname. Plain callers
// (e.g. /farms?new=1) don't need this — dropping the whole query is fine.
// Callers whose flag also selects other UI (e.g. the season detail tabs,
// where `?new=harvests` both opens a dialog AND picks the tab) must pass the
// param that encodes that selection (e.g. "tab=korrje"), so cleanup doesn't
// erase information a server re-render needs to re-derive the same UI state
// — otherwise the page would snap back to its default on cleanup.
export function useOpenOnFlag(
  paramName: string,
  matchValue = "1",
  replacementSearch?: string
): [boolean, Dispatch<SetStateAction<boolean>>] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const flag = searchParams.get(paramName) === matchValue;

  const [open, setOpen] = useState(flag);
  const [syncedFlag, setSyncedFlag] = useState(flag);
  if (flag !== syncedFlag) {
    setSyncedFlag(flag);
    if (flag) {
      setOpen(true);
    }
  }

  useEffect(() => {
    if (flag) {
      router.replace(
        replacementSearch ? `${pathname}?${replacementSearch}` : pathname
      );
    }
  }, [flag, pathname, router, replacementSearch]);

  return [open, setOpen];
}
