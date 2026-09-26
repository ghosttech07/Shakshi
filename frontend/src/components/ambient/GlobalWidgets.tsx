"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { useSite } from "@/lib/site-context";

// Everything here waits until after the page is interactive, so none of it slows the first paint.
const CartDrawer = dynamic(() => import("@/components/commerce/CartDrawer").then((m) => m.CartDrawer), { ssr: false });
const QuickView = dynamic(() => import("@/components/commerce/QuickView").then((m) => m.QuickView), { ssr: false });
const Concierge = dynamic(() => import("@/components/features/Concierge").then((m) => m.Concierge), { ssr: false });
const ExitIntent = dynamic(() => import("@/components/features/ExitIntent").then((m) => m.ExitIntent), { ssr: false });
const SocialProof = dynamic(() => import("./SocialProof").then((m) => m.SocialProof), { ssr: false });
const Cursor = dynamic(() => import("./Cursor").then((m) => m.Cursor), { ssr: false });
const FlyToCart = dynamic(() => import("./FlyToCart").then((m) => m.FlyToCart), { ssr: false });
const SiteEffects = dynamic(() => import("./SiteEffects").then((m) => m.SiteEffects), { ssr: false });

export function GlobalWidgets() {
  const { theme, popups } = useSite();
  const t = theme.toggles;
  return (
    <>
      <CartDrawer />
      <QuickView />
      {t.concierge && <Concierge />}
      {popups.exitIntent.enabled && <ExitIntent />}
      {t.socialProof && <SocialProof />}
      {t.cursor && theme.motion === "full" && <Cursor />}
      <FlyToCart />
      <Suspense fallback={null}>
        <SiteEffects />
      </Suspense>
    </>
  );
}
