"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { EASE, cn } from "@shakshi/shared/utils";
import { IconClose } from "./Icons";
import { lockScroll, unlockScroll } from "@/components/layout/SmoothScroll";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  hideTitle?: boolean;
  children: ReactNode;
  variant?: "center" | "right" | "bottom";
  className?: string;
  dark?: boolean;
};

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/** Accessible modal / drawer: focus trap, Escape to close, focus restored, background scroll paused. */
export function Dialog({ open, onClose, title, hideTitle, children, variant = "center", className, dark }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lockScroll();
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const motionProps = {
    center: { initial: { opacity: 0, y: reduce ? 0 : 30, scale: reduce ? 1 : 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: reduce ? 0 : 20 } },
    right: { initial: { x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }, animate: { x: 0, opacity: 1 }, exit: { x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 } },
    bottom: { initial: { y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }, animate: { y: 0, opacity: 1 }, exit: { y: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 } },
  }[variant];

  const position = {
    center: "inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6",
    right: "inset-y-0 right-0 flex w-full sm:w-auto",
    bottom: "inset-x-0 bottom-0 flex",
  }[variant];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            className="absolute inset-0 bg-midnight/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            onClick={onClose}
            aria-hidden
          />
          <div className={cn("pointer-events-none absolute", position)}>
            <motion.div
              ref={panel}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-lenis-prevent
              className={cn(
                "pointer-events-auto relative max-h-[100dvh] overflow-y-auto overscroll-contain",
                dark ? "bg-midnight text-pearl linen-dark" : "bg-ivory text-ink linen",
                variant === "center" && "w-full rounded-t-2xl sm:rounded-sm max-h-[92dvh] sm:max-w-3xl shadow-lift",
                variant === "right" && "h-full w-full sm:w-[440px] shadow-lift",
                variant === "bottom" && "w-full max-h-[85dvh] rounded-t-2xl shadow-lift",
                className
              )}
              {...motionProps}
              transition={{ duration: reduce ? 0.3 : 0.9, ease: EASE }}
            >
              <div className={cn("flex items-center justify-between gap-4 px-6 pt-6", hideTitle && "absolute right-0 top-0 z-10")}>
                <h2 id={titleId} className={cn("text-2xl", hideTitle && "sr-only")}>
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors duration-500",
                    dark ? "hover:bg-pearl/10" : "hover:bg-midnight/5",
                    hideTitle && "glass"
                  )}
                >
                  <IconClose size={20} />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
