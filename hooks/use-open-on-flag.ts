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
export function useOpenOnFlag(
  paramName: string,
  matchValue = "1"
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
      router.replace(pathname);
    }
  }, [flag, pathname, router]);

  return [open, setOpen];
}
