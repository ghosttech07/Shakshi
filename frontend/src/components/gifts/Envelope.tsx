"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import type { ReactNode } from "react";
import { cn } from "@shakshi/shared/utils";

export const DESIGNS = {
  midnight: { name: "Midnight", paper: "#1a2233", inner: "#0e1420", ink: "#f5f0e8", accent: "#c9a96e" },
  ivory: { name: "Ivory", paper: "#efe7da", inner: "#e3d8c6", ink: "#1c2230", accent: "#9a6a1c" },
  blush: { name: "Blush", paper: "#ead2c9", inner: "#dcbcb0", ink: "#1c2230", accent: "#9a6a1c" },
} as const;
export type DesignId = keyof typeof DESIGNS;

const EASE = [0.65, 0, 0.35, 1] as const;

/**
 * A digital envelope. Closed, it shows who it's for; opened, the flap folds back and the card
 * rises out of the pocket. `open` drives the animation both ways.
 */
export function Envelope({ design, open, to, children, onOpen }: { design: DesignId; open: boolean; to?: string; children: ReactNode; onOpen?: () => void }) {
  const d = DESIGNS[design];
  const reduce = useReducedMotion();
  const t = (delay: number, duration = 1) => ({ duration: reduce ? 0.3 : duration, delay: reduce ? 0 : delay, ease: EASE });

  return (
    <div className="relative mx-auto aspect-[3/2] w-full max-w-md" style={{ perspective: 1400 }}>
      {/* Back of the envelope and its lining */}
      <div className="absolute inset-0 rounded-md shadow-lift" style={{ background: d.inner }} />
      {/* The card, tucked inside until opened */}
      <motion.div
        className="absolute inset-x-[6%] top-[6%] z-[2] h-[88%] rounded-sm shadow-soft"
        initial={false}
        animate={open ? { y: "-58%", scale: 1.04 } : { y: "0%", scale: 1 }}
        transition={t(open ? 0.75 : 0, 1.2)}
      >
        {children}
      </motion.div>
      {/* Front pocket (two folds) */}
      <div className="pointer-events-none absolute inset-0 z-[3] rounded-md" style={{ background: d.paper, clipPath: "polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)" }} />
      <div className="pointer-events-none absolute inset-0 z-[3] rounded-md" style={{ background: "linear-gradient(160deg, rgb(255 255 255 / .08), transparent 40%, rgb(0 0 0 / .08))", clipPath: "polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%)" }} />
      {!open && to && (
        <p className="absolute inset-x-0 bottom-[14%] z-[4] text-center font-serif text-2xl italic" style={{ color: d.ink }}>
          For {to}
        </p>
      )}
      {/* The flap folds back over the top edge */}
      <motion.div
        className="absolute inset-x-0 top-0 z-[5] h-[62%] origin-top"
        style={{ transformStyle: "preserve-3d" }}
        initial={false}
        animate={open ? { rotateX: 178, zIndex: 1 } : { rotateX: 0, zIndex: 5 }}
        transition={{ ...t(0, 0.9), zIndex: { delay: open ? 0.45 : 0.5 } }}
      >
        <div className="absolute inset-0" style={{ background: d.paper, clipPath: "polygon(0 0, 100% 0, 50% 100%)", filter: "brightness(0.96)" }} />
        {/* Wax seal */}
        <motion.button
          type="button"
          onClick={onOpen}
          disabled={!onOpen || open}
          aria-label="Open the envelope"
          className="absolute left-1/2 top-full grid h-14 w-14 -translate-x-1/2 -translate-y-[65%] place-items-center rounded-full shadow-[0_4px_14px_rgb(0_0_0/0.25)]"
          style={{ background: `radial-gradient(circle at 35% 30%, #e0c48f, ${d.accent})` }}
          animate={open ? { opacity: 0 } : { opacity: 1 }}
          whileHover={onOpen && !open ? { scale: 1.06 } : undefined}
          transition={{ duration: 0.4 }}
        >
          <span className="font-serif text-2xl font-semibold text-[#f5ead2]">S</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

/** The card itself: amount, message and who it's from. */
export function GiftCardFace({ design, amount, to, from, message, code, className }: { design: DesignId; amount: string; to?: string; from?: string; message?: string; code?: string; className?: string }) {
  const d = DESIGNS[design];
  return (
    <div className={cn("flex h-full flex-col justify-between rounded-sm p-5 sm:p-6", className)} style={{ background: d.paper, color: d.ink, backgroundImage: "repeating-linear-gradient(0deg, rgb(0 0 0/.025) 0 1px, transparent 1px 3px)" }}>
      <div className="flex items-start justify-between gap-3">
        <span className="logo logo-wordmark h-6" style={{ backgroundColor: d.ink }} role="img" aria-label="Shakshi" />
        <span className="text-[0.6rem] uppercase tracking-[0.25em]" style={{ color: d.accent }}>
          Gift card
        </span>
      </div>
      <div>
        <p className="font-serif text-4xl sm:text-5xl">{amount}</p>
        {message && <p className="mt-2 line-clamp-2 font-serif text-sm italic opacity-80">&ldquo;{message}&rdquo;</p>}
      </div>
      <div className="flex items-end justify-between gap-3 text-xs">
        <span className="opacity-75">
          {to ? `For ${to}` : ""}
          {from ? ` · from ${from}` : ""}
        </span>
        {code && <span className="font-mono tracking-wider">{code}</span>}
      </div>
    </div>
  );
}
