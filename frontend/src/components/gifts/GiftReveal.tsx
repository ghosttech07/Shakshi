"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { formatINR } from "@shakshi/shared/utils";
import { Envelope, GiftCardFace, DESIGNS, type DesignId } from "./Envelope";
import { IconArrow } from "@/components/ui/Icons";

type Gift = { code: string; amount: number; balance: number; to?: string; from?: string; message?: string; design?: string };

/** The recipient's envelope: they break the seal themselves. */
export function GiftReveal({ code }: { code: string }) {
  const [gift, setGift] = useState<Gift | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "offline">("loading");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/gift-cards/${encodeURIComponent(code)}`)
      .then(async (r) => {
        if (r.status === 404) return setState("missing");
        if (!r.ok || !r.headers.get("content-type")?.includes("json")) return setState("offline");
        setGift(await r.json());
        setState("ready");
      })
      .catch(() => setState("offline"));
  }, [code]);

  if (state === "loading") return <div className="skeleton mx-auto aspect-[3/2] max-w-md" />;
  if (state !== "ready" || !gift)
    return (
      <div className="text-center">
        <p className="display text-4xl">{state === "missing" ? "We couldn't find this envelope." : "Your gift is safe with us."}</p>
        <p className="mt-4 text-pearl/65">{state === "missing" ? "Please check the link, or ask the sender to share it again." : "We can't open envelopes just this moment. Please try again shortly."}</p>
      </div>
    );

  const design = (gift.design && gift.design in DESIGNS ? gift.design : "midnight") as DesignId;

  return (
    <div className="text-center">
      <p className="eyebrow text-gold">{open ? "With love" : "Something for you"}</p>
      <div className="mt-16">
        <Envelope design={design} open={open} to={gift.to} onOpen={() => setOpen(true)}>
          <GiftCardFace design={design} amount={formatINR(gift.amount)} to={gift.to} from={gift.from} message={gift.message} code={open ? gift.code : undefined} />
        </Envelope>
      </div>
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button key="open" onClick={() => setOpen(true)} className="btn btn-gold mt-14" exit={{ opacity: 0 }}>
            Break the seal
          </motion.button>
        ) : (
          <motion.div key="inside" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8, duration: 1, ease: [0.65, 0, 0.35, 1] }} className="mx-auto mt-12 max-w-md">
            {gift.message && <p className="font-serif text-2xl italic leading-snug">&ldquo;{gift.message}&rdquo;</p>}
            {gift.from && <p className="mt-3 text-sm text-pearl/65">From {gift.from}</p>}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="border border-pearl/20 px-4 py-2.5 font-mono tracking-wider">{gift.code}</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(gift.code).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
                className="text-xs uppercase tracking-[0.2em] text-gold hover:text-gold-soft"
              >
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
            <p className="mt-3 text-xs text-pearl/55">Balance {formatINR(gift.balance)} · enter this code at checkout</p>
            <Link href="/shop" className="btn btn-gold mt-8">
              Choose something restful <IconArrow size={16} />
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
