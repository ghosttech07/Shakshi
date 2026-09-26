"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { IMG } from "@shakshi/shared/images";
import { cn, formatINR } from "@shakshi/shared/utils";
import { DESIGNS, Envelope, GiftCardFace, type DesignId } from "./Envelope";

const AMOUNTS = [10000, 25000, 50000, 100000];
const MIN = 2000;
const MAX = 500000;

export function GiftCardBuilder() {
  const addToCart = useStore((s) => s.addToCart);
  const [amount, setAmount] = useState(25000);
  const [custom, setCustom] = useState("");
  const [design, setDesign] = useState<DesignId>("midnight");
  const [to, setTo] = useState("");
  const [email, setEmail] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const value = custom ? Math.round(Number(custom)) : amount;

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!(value >= MIN && value <= MAX)) return setError(`Choose an amount between ${formatINR(MIN)} and ${formatINR(MAX)}.`);
    if (!to.trim() || !from.trim()) return setError("Add who it's for, and who it's from.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Please check the recipient's email.");
    setError("");
    addToCart({
      key: `gift-${Date.now()}`,
      kind: "giftcard",
      ref: "giftcard",
      name: "Shakshi Gift Card",
      detail: `For ${to.trim()} · ${DESIGNS[design].name} envelope`,
      image: IMG.linen,
      price: value,
      gift: { to: to.trim(), email: email.trim() || undefined, from: from.trim(), message: message.trim() || undefined, design },
    });
  };

  return (
    <div className="grid items-start gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
      <div className="lg:sticky lg:top-28">
        <div className="bg-ivory-2/60 px-6 pb-10 pt-24 linen sm:px-12">
          <Envelope design={design} open={open} to={to || "someone special"}>
            <GiftCardFace design={design} amount={formatINR(value || 0)} to={to} from={from} message={message} />
          </Envelope>
        </div>
        <button onClick={() => setOpen(!open)} className="mt-4 text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
          {open ? "Close the envelope" : "Preview the opening"}
        </button>
      </div>

      <form onSubmit={add} noValidate>
        <fieldset>
          <legend className="eyebrow text-stone">Amount</legend>
          <div role="radiogroup" aria-label="Amount" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AMOUNTS.map((a) => (
              <button type="button" key={a} role="radio" aria-checked={!custom && amount === a} onClick={() => { setAmount(a); setCustom(""); }} className={cn("border py-3 text-sm transition-colors duration-500", !custom && amount === a ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold")}>
                {formatINR(a)}
              </button>
            ))}
          </div>
          <label className="mt-4 block">
            <span className="eyebrow text-stone">Or your own amount</span>
            <input inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))} placeholder={`${formatINR(MIN)} – ${formatINR(MAX)}`} className="field" />
          </label>
        </fieldset>

        <fieldset className="mt-8">
          <legend className="eyebrow text-stone">Envelope</legend>
          <div role="radiogroup" aria-label="Envelope colour" className="mt-3 flex gap-4">
            {(Object.keys(DESIGNS) as DesignId[]).map((k) => (
              <button type="button" key={k} role="radio" aria-checked={design === k} onClick={() => setDesign(k)} className="flex flex-col items-center gap-2">
                <span className={cn("block h-11 w-16 rounded-sm border transition-all duration-500", design === k ? "ring-1 ring-gold ring-offset-4 ring-offset-ivory" : "border-ink/15")} style={{ background: DESIGNS[k].paper }} />
                <span className="text-xs text-stone">{DESIGNS[k].name}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <label>
            <span className="eyebrow text-stone">For</span>
            <input value={to} onChange={(e) => setTo(e.target.value)} maxLength={40} className="field" placeholder="Their name" />
          </label>
          <label>
            <span className="eyebrow text-stone">Their email (optional)</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="We'll send the envelope" />
          </label>
          <label className="sm:col-span-2">
            <span className="eyebrow text-stone">From</span>
            <input value={from} onChange={(e) => setFrom(e.target.value)} maxLength={40} className="field" placeholder="Your name" />
          </label>
          <label className="sm:col-span-2">
            <span className="flex justify-between">
              <span className="eyebrow text-stone">A note</span>
              <span className="text-xs text-stone">{message.length}/200</span>
            </span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 200))} rows={3} className="field resize-none" placeholder="Sleep well, and often." />
          </label>
        </div>
        {error && <p className="mt-4 text-sm text-[#9a5a4a]" role="alert">{error}</p>}
        <button type="submit" className="btn btn-gold mt-8 w-full">
          Add gift card · {formatINR(value || 0)}
        </button>
        <p className="mt-4 text-xs leading-relaxed text-stone">Delivered as a digital envelope after checkout. Redeemable on anything at Shakshi, online or in our salons, for three years.</p>
      </form>
    </div>
  );
}
