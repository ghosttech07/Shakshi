"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState, type FormEvent } from "react";
import { estimateDelivery, formatDate, EASE, type DeliveryEstimate } from "@shakshi/shared/utils";
import { IconTruck, IconCheck } from "@/components/ui/Icons";
import { useSite } from "@/lib/site-context";

export function DeliveryEstimator() {
  const id = useId();
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<DeliveryEstimate | null>(null);
  const site = useSite();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setResult(estimateDelivery(pin, site.commerce));
  };

  return (
    <div className="border border-ink/10 p-5">
      <form onSubmit={submit} className="flex items-end gap-3">
        <IconTruck size={24} className="mb-2 shrink-0 text-gold-ink" />
        <div className="flex-1">
          <label htmlFor={id} className="eyebrow text-stone">Delivery to</label>
          <input
            id={id}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter pincode"
            className="field py-1.5"
            aria-describedby={`${id}-out`}
          />
        </div>
        <button type="submit" className="pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink">
          Check
        </button>
      </form>
      <div id={`${id}-out`} aria-live="polite">
        <AnimatePresence mode="wait">
          {result && (
            <motion.div key={JSON.stringify(result)} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.7, ease: EASE }} className="overflow-hidden">
              {result.ok ? (
                <div className="pt-4 text-sm">
                  <p>
                    Arrives between <strong className="font-semibold">{formatDate(result.earliest)}</strong> and <strong className="font-semibold">{formatDate(result.latest)}</strong>
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-stone">
                    <IconCheck size={16} className="text-gold-ink" />
                    {result.whiteGlove ? `White-glove set-up available · ${result.region}` : `Doorstep delivery · ${result.region}; white-glove on request`}
                  </p>
                </div>
              ) : (
                <p className="pt-4 text-sm text-[#9a5a4a]">{result.message}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
