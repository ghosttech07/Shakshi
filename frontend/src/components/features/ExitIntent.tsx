"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Img } from "@/components/ui/Img";
import { useStore } from "@/lib/store";
import { IMG } from "@shakshi/shared/images";
import { IconArrow } from "@/components/ui/Icons";
import { NewsletterForm } from "./NewsletterForm";

const KEY = "shakshi-exit-shown";

/** A quiet farewell for desktop visitors heading for the address bar. Once per session, never mid-purchase. */
export function ExitIntent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/checkout") || pathname.startsWith("/quiz")) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    try {
      if (sessionStorage.getItem(KEY)) return;
    } catch {
      return;
    }
    const armedAt = Date.now() + 15000;
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget || e.clientY > 0 || Date.now() < armedAt) return;
      const s = useStore.getState();
      if (s.cartOpen || s.quickView || s.conciergeOpen) return;
      setOpen(true);
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
      document.removeEventListener("mouseout", onOut);
    };
    document.addEventListener("mouseout", onOut);
    return () => document.removeEventListener("mouseout", onOut);
  }, [pathname]);

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onClose={close} title="Before you drift away" hideTitle dark className="sm:max-w-3xl">
      <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
        <Img src={IMG.sleepMoody} alt="Someone sleeping peacefully in soft linen" sizes="360px" dark wrapperClassName="hidden sm:block min-h-[480px]" />
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className="eyebrow text-gold">Before you drift away</p>
          <p className="display mt-4 text-4xl sm:text-5xl" aria-hidden>
            Sixty seconds to your <em className="text-gold-soft">perfect</em> night.
          </p>
          <p className="mt-5 text-sm leading-relaxed text-pearl/70">Seven gentle questions, and we&rsquo;ll match you to the mattress your body has been waiting for.</p>
          <Link href="/quiz" onClick={close} className="btn btn-gold mt-8 self-start" data-autofocus>
            Take the Sleep Quiz <IconArrow size={16} />
          </Link>
          <div className="gold-rule my-8" />
          <p className="text-sm text-pearl/70">Or join the Sleep Society and receive a complimentary Silk Protector with your first mattress.</p>
          <NewsletterForm dark compact />
        </div>
      </div>
    </Dialog>
  );
}
