"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EASE, cn, formatINR } from "@/lib/utils";

const TENURES = [3, 6, 9, 12, 18, 24];
const NO_COST_UP_TO = 12;
const ANNUAL_RATE = 0.13; // indicative bank rate beyond no-cost tenures

/** Monthly instalment: no-cost splits evenly; longer tenures use the standard reducing-balance formula. */
export function emi(total: number, months: number) {
  if (months <= NO_COST_UP_TO) return { monthly: Math.ceil(total / months), interest: 0 };
  const r = ANNUAL_RATE / 12;
  const monthly = Math.ceil((total * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
  return { monthly, interest: monthly * months - total };
}

/** The lowest monthly figure we can honestly quote for a mattress: smallest size, longest tenure. */
export const lowestMonthly = (smallestPrice: number) => emi(smallestPrice, TENURES[TENURES.length - 1]).monthly;

export function EmiCalculator({ total }: { total: number }) {
  const [open, setOpen] = useState(false);
  const [months, setMonths] = useState(12);
  const { monthly, interest } = emi(total, months);
  return (
    <div className="border-t border-ink/10 pt-4">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left text-sm">
        <span>
          Pay monthly from <strong className="font-semibold">{formatINR(emi(total, 24).monthly)}</strong>
          <span className="text-stone"> · no-cost up to 12 months</span>
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-gold-ink">{open ? "Close" : "Calculate"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.7, ease: EASE }} className="overflow-hidden">
            <div role="radiogroup" aria-label="EMI tenure" className="mt-4 grid grid-cols-6 gap-1.5">
              {TENURES.map((m) => (
                <button key={m} role="radio" aria-checked={months === m} onClick={() => setMonths(m)} className={cn("border py-2 text-center text-xs transition-colors duration-500", months === m ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold")}>
                  {m}
                  <span className="block text-[0.6rem] opacity-70">mo</span>
                </button>
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-sm" aria-live="polite">
              <div>
                <dt className="text-xs text-stone">Monthly</dt>
                <dd className="font-serif text-2xl">{formatINR(monthly)}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone">Interest</dt>
                <dd className="font-serif text-2xl">{interest ? formatINR(interest) : "₹0"}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone">Total</dt>
                <dd className="font-serif text-2xl">{formatINR(total + interest)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-stone">
              {months <= NO_COST_UP_TO ? "No-cost EMI on major credit cards: the interest is on us." : `Indicative at ${ANNUAL_RATE * 100}% p.a.; your bank's rate may differ.`} Choose EMI at checkout.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
