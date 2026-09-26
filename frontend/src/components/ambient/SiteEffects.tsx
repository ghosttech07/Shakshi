"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "@/lib/account";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { track } from "@/lib/analytics";
import { REFERRAL_RE, REFERRAL_REWARD } from "@shakshi/shared/orders";
import { formatINR } from "@shakshi/shared/utils";

/** Invisible housekeeping: page-view analytics and capturing a friend's referral link. */
export function SiteEffects() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useHydrated();
  const setReferredBy = useAccount((s) => s.setReferredBy);
  const toast = useStore((s) => s.toast);

  useEffect(() => {
    if (!pathname.startsWith("/admin")) track("page_view");
  }, [pathname]);

  useEffect(() => {
    if (!hydrated) return;
    const ref = params.get("ref")?.toUpperCase();
    if (!ref || !REFERRAL_RE.test(ref)) return;
    const acct = useAccount.getState();
    if (acct.referralCode !== ref && acct.orders.every((o) => o.sample)) {
      setReferredBy(ref);
      toast(`A friend has gifted you ${formatINR(REFERRAL_REWARD)} off your first mattress`);
    }
    const url = new URL(location.href);
    url.searchParams.delete("ref");
    router.replace(url.pathname + url.search + url.hash, { scroll: false });
  }, [hydrated, params, router, setReferredBy, toast]);

  return null;
}
