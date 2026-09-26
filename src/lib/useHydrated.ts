"use client";

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { useAccount } from "./account";

let pending: Promise<void> | null = null;
let rehydrated = false;

/** True once the locally-saved cart, wishlist, history and account have been restored in the browser. */
export function useHydrated() {
  const [ready, setReady] = useState(rehydrated);
  useEffect(() => {
    if (rehydrated) return setReady(true);
    pending ??= Promise.all([useStore.persist.rehydrate(), useAccount.persist.rehydrate()]).then(() => {
      rehydrated = true;
    });
    let alive = true;
    pending.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}
