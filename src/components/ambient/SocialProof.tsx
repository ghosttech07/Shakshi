"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EASE } from "@/lib/utils";
import { IconClose } from "@/components/ui/Icons";

type Notice = { city: string; product: string; size: string; minutesAgo: number; demo?: boolean };

const KEY = "shk-proof";
const FIRST_DELAY = 25_000;
const GAP = 80_000;
const MAX_PER_SESSION = 3;

const ago = (m: number) => (m < 2 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} hr ago` : `${Math.round(m / 1440)} days ago`);

/**
 * A quiet, occasional note about a real recent purchase (city, mattress, size; never a name).
 * At most three per session, never during checkout, and easy to silence.
 */
export function SocialProof() {
  const pathname = usePathname();
  const [notice, setNotice] = useState<Notice | null>(null);
  const queue = useRef<Notice[]>([]);
  const blocked = pathname.startsWith("/checkout") || pathname.startsWith("/admin") || pathname.startsWith("/account");
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;

  useEffect(() => {
    let shown = 0;
    try {
      const s = sessionStorage.getItem(KEY);
      if (s === "off") return;
      shown = Number(s) || 0;
    } catch {
      return;
    }
    if (shown >= MAX_PER_SESSION) return;
    let timer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;

    const next = () => {
      if (document.visibilityState !== "visible" || blockedRef.current) {
        timer = setTimeout(next, 15_000);
        return;
      }
      const n = queue.current.shift();
      if (!n) return;
      setNotice(n);
      shown++;
      try {
        sessionStorage.setItem(KEY, String(shown));
      } catch {}
      hideTimer = setTimeout(() => setNotice(null), 7000);
      if (shown < MAX_PER_SESSION) timer = setTimeout(next, GAP);
    };

    timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/social-proof");
        const { notices } = (await res.json()) as { notices: Notice[] };
        queue.current = notices.sort(() => Math.random() - 0.5);
        next();
      } catch {}
    }, FIRST_DELAY);
    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  const silence = () => {
    setNotice(null);
    try {
      sessionStorage.setItem(KEY, "off");
    } catch {}
  };

  return (
    <div className="pointer-events-none fixed bottom-5 left-5 z-[65] max-w-[calc(100vw-6.5rem)] sm:bottom-8 sm:left-8" role="status" aria-live="polite">
      <AnimatePresence>
        {notice && !blocked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 1, ease: EASE }}
            className="glass pointer-events-auto flex max-w-sm items-center gap-3 rounded-full py-2 pl-4 pr-2 text-sm text-ink shadow-soft"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
            <p className="leading-snug">
              Someone in {notice.city} chose {notice.product.replace("The ", "the ")}
              {notice.size && `, ${notice.size}`} <span className="text-stone">· {ago(notice.minutesAgo)}</span>
              {notice.demo && <span className="ml-1.5 rounded bg-ink/10 px-1.5 py-0.5 text-[0.6rem] uppercase tracking-[0.15em] text-stone">Sample</span>}
            </p>
            <button onClick={silence} aria-label="Hide these notices" className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-ink/10">
              <IconClose size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
