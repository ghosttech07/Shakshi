"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Img } from "@/components/ui/Img";
import { useStore } from "@/lib/store";
import { IconArrow } from "@/components/ui/Icons";
import { NewsletterForm } from "./NewsletterForm";
import { Emph } from "@/components/cms/text";
import { isLive, useSite } from "@/lib/site-context";

const KEY = "shakshi-exit-shown";

/** A quiet farewell for desktop visitors heading for the address bar. Once per session, never mid-purchase. */
export function ExitIntent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const p = useSite().popups.exitIntent;

  useEffect(() => {
    if (!isLive(p)) return;
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
  }, [pathname, p]);

  const close = () => setOpen(false);

  return (
    <Dialog open={open} onClose={close} title={p.eyebrow || p.title.replace(/\*/g, "")} hideTitle dark className="sm:max-w-3xl">
      <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
        {p.image && <Img src={p.image} alt="" sizes="360px" dark wrapperClassName="hidden sm:block min-h-[480px]" />}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          {p.eyebrow && <p className="eyebrow text-gold">{p.eyebrow}</p>}
          <p className="display mt-4 text-4xl sm:text-5xl" aria-hidden>
            <Emph text={p.title} emClassName="text-gold-soft" />
          </p>
          <p className="mt-5 text-sm leading-relaxed text-pearl/70">{p.body}</p>
          <Link href={p.ctaLink || "/quiz"} onClick={close} className="btn btn-gold mt-8 self-start" data-autofocus>
            {p.ctaText} <IconArrow size={16} />
          </Link>
          <div className="gold-rule my-8" />
          <p className="text-sm text-pearl/70">{p.offer}</p>
          <NewsletterForm dark compact />
        </div>
      </div>
    </Dialog>
  );
}
