"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState, type FormEvent } from "react";
import { EASE, cn } from "@shakshi/shared/utils";
import { IconArrow, IconCheck } from "@/components/ui/Icons";

export function NewsletterForm({ dark, compact }: { dark?: boolean; compact?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState("error");
    setState("done");
  };

  return (
    <div className={cn(compact ? "mt-5" : "mt-10")}>
      <AnimatePresence mode="wait">
        {state === "done" ? (
          <motion.p key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }} className="flex items-center gap-3 font-serif text-xl" role="status">
            <IconCheck size={22} className="text-gold" /> Welcome to the Society. Your gift awaits in your inbox.
          </motion.p>
        ) : (
          <motion.form key="form" onSubmit={submit} noValidate exit={{ opacity: 0 }} className="relative">
            <label htmlFor={id} className="sr-only">Email address</label>
            <input
              id={id}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === "error") setState("idle");
              }}
              placeholder="Your email address"
              aria-invalid={state === "error"}
              aria-describedby={state === "error" ? `${id}-err` : undefined}
              className={cn("field pr-14", dark && "field-dark", compact ? "text-base" : "text-lg")}
            />
            <button type="submit" aria-label="Join the Sleep Society" className="absolute bottom-1 right-0 grid h-10 w-10 place-items-center text-gold transition-transform duration-700 ease-silk hover:translate-x-1">
              <IconArrow size={22} />
            </button>
            {state === "error" && (
              <p id={`${id}-err`} className="mt-2 text-xs text-blush">
                Please share a valid email address.
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
