"use client";

import { useEffect } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { refreshAccount, watchAccount } from "@/lib/account-client";

/** Loads the signed-in customer's account on every page load, and saves their changes as they happen. */
export function AccountSync() {
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    watchAccount();
    void refreshAccount();
  }, [hydrated]);
  return null;
}
