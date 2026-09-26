"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { EASE } from "@shakshi/shared/utils";

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[120] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.p
            key={t.id}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="glass-dark rounded-full px-5 py-2.5 text-sm text-pearl shadow-soft"
          >
            {t.message}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
