"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/motion";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useStore, cartSubtotal } from "@/lib/store";
import { useHydrated } from "@/lib/useHydrated";
import { useAccount } from "@/lib/account";
import { useSite } from "@/lib/site-context";
import { postJSON } from "@/lib/api";
import { track } from "@/lib/analytics";
import { POINTS } from "@shakshi/shared/orders";
import { EASE, cn, emiFrom, estimateDelivery, formatINR, addDeliveryDays } from "@shakshi/shared/utils";
import { Img } from "@/components/ui/Img";
import { TrustBadges, GiftProgress } from "./CartDrawer";
import { SignInPanel } from "@/components/account/SignInPanel";
import { IconCheck, IconArrowLeft, IconLock, IconMoon, IconGift, IconArrow } from "@/components/ui/Icons";

const STEPS = ["Details", "Delivery", "Payment", "Review"] as const;

type Pay = "emi" | "card" | "upi" | "later";
const PAY: { id: Pay; title: string; note: string; badge?: string }[] = [
  { id: "emi", title: "No-cost EMI", note: "3, 6 or 12 months on major credit cards", badge: "Most chosen" },
  { id: "later", title: "Pay later", note: "Pay in 3 interest-free instalments" },
  { id: "upi", title: "UPI", note: "Any UPI app, instantly" },
  { id: "card", title: "Credit or debit card", note: "Visa, Mastercard, RuPay, Amex" },
];

const dayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

function Field({ label, value, onChange, error, className, ...rest }: { label: string; value: string; onChange: (v: string) => void; error?: string; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const id = `co-${label.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="eyebrow text-stone">{label}</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} className="field" {...rest} />
      {error && <p id={`${id}-e`} className="mt-1.5 text-xs text-[#9a5a4a]">{error}</p>}
    </div>
  );
}

export function Checkout() {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const cart = useStore((s) => s.cart);
  const clearCart = useStore((s) => s.clearCart);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [d, setD] = useState({ email: "", phone: "", first: "", last: "", address: "", city: "", pincode: "" });
  const [slot, setSlot] = useState<string>("");
  const [removal, setRemoval] = useState(false);
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<Pay>("emi");
  const [months, setMonths] = useState(12);
  const [order, setOrder] = useState<{ id: string; total: number; email: string; giftCodes: { code: string; amount: number; to: string }[] } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; amount: number; label: string } | null>(null);
  const [promoError, setPromoError] = useState("");
  const profile = useAccount((s) => s.profile);
  const referredBy = useAccount((s) => s.referredBy);
  const cartId = useAccount((s) => s.cartId);
  const addOrder = useAccount((s) => s.addOrder);
  const prefilled = useRef(false);

  const site = useSite();
  const subtotal = cartSubtotal(cart);
  const hasRemovalInCart = cart.some((c) => c.ref === "removal");
  const hasMattress = cart.some((c) => c.kind === "mattress");
  const removalFee = removal && !hasRemovalInCart ? site.commerce.removalFee : 0;
  const discount = promo ? Math.min(promo.amount, subtotal) : 0;
  const total = Math.max(0, subtotal + removalFee - discount);

  useEffect(() => track("checkout_step", { step: 1 }), []);

  // Signed-in members skip retyping their name and email.
  useEffect(() => {
    if (!hydrated || prefilled.current || !profile) return;
    prefilled.current = true;
    const [first, ...rest] = profile.name.split(" ");
    setD((x) => ({ ...x, email: profile.email, phone: x.phone || profile.phone || "", first: x.first || first, last: x.last || rest.join(" ") }));
  }, [hydrated, profile]);

  const applyPromo = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setPromoError("");
    const r = await postJSON<{ code: string; amount: number; label: string }>("/api/promo", { code, subtotal, hasMattress });
    if (r.ok) {
      setPromo({ code: r.data.code, amount: r.data.amount, label: r.data.label });
      setPromoInput("");
    } else {
      setPromo(null);
      setPromoError(r.offline ? "Codes can't be checked just now. Please try again in a moment." : r.error);
    }
  };

  // A friend's referral link applies itself.
  useEffect(() => {
    if (hydrated && referredBy && hasMattress && !promo) applyPromo(referredBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, referredBy, hasMattress]);
  const gift = subtotal >= site.commerce.freeGiftThreshold;

  const estimate = useMemo(() => estimateDelivery(d.pincode, site.commerce), [d.pincode, site.commerce]);
  const dates = useMemo(() => {
    if (!estimate.ok) return [];
    return Array.from({ length: 6 }, (_, i) => addDeliveryDays(estimate.earliest, i).toDateString()).filter((v, i, a) => a.indexOf(v) === i);
  }, [estimate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && !profile) return false;
    if (step === 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = "A valid email, please.";
      if (!/^[6-9]\d{9}$/.test(d.phone.replace(/\D/g, "").slice(-10))) e.phone = "A 10-digit mobile number, please.";
      if (!d.first.trim()) e.first = "Required.";
      if (!d.last.trim()) e.last = "Required.";
      if (d.address.trim().length < 8) e.address = "Your full address, please.";
      if (!d.city.trim()) e.city = "Required.";
      if (!/^[1-9]\d{5}$/.test(d.pincode)) e.pincode = "A six-digit pincode.";
      else if (!estimate.ok) e.pincode = estimate.message;
    }
    if (step === 1 && !slot) e.slot = "Choose a delivery day.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const next = () => {
    if (!validate()) return;
    // Once we have contact details, keep the bag so the team can help if the order isn't finished.
    if (step === 0)
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, email: d.email, phone: d.phone, name: `${d.first} ${d.last}`.trim(), step: 1, items: cart.map(({ name, detail, qty, price, image }) => ({ name, detail, qty, price, image })) }),
        keepalive: true,
      }).catch(() => {});
    track("checkout_step", { step: step + 2 });
    setStep(Math.min(STEPS.length - 1, step + 1));
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const place = async () => {
    setPlacing(true);
    setPlaceError("");
    try {
      const r = await postJSON<{ id: string; token: string; createdAt: string; deliveryDate: string; total: number; giftCodes: { code: string; amount: number; to: string }[] }>("/api/orders", {
        items: cart,
        customer: d,
        deliveryDate: new Date(slot).toISOString(),
        payment: pay,
        months: pay === "emi" ? months : undefined,
        removal,
        note,
        promoCode: promo?.code,
        cartId,
      });
      if (!r.ok && /sign in/i.test(r.error)) {
        useAccount.setState({ profile: null });
        setStep(0);
      }
      if (!r.ok) throw new Error(r.offline ? "We can't place orders online just this moment. Your bag is saved: please try again shortly, or WhatsApp our concierge and we'll complete it for you." : r.error);
      const j = r.data;
      addOrder({ id: j.id, token: j.token, createdAt: j.createdAt, deliveryDate: j.deliveryDate, total: j.total, items: cart, giftCodes: j.giftCodes, customer: d, discount, removal: removalFee });
      track("purchase", { order: j.id, total: j.total, items: cart.length });
      const acct = useAccount.getState();
      if (promo && promo.code === acct.referredBy) acct.setReferredBy(null);
      acct.newCart();
      setOrder({ id: j.id, total: j.total, email: d.email, giftCodes: j.giftCodes ?? [] });
      clearCart();
      window.scrollTo({ top: 0 });
    } catch (e) {
      setPlaceError(e instanceof Error && e.message ? e.message : "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const onPromo = (e: FormEvent) => {
    e.preventDefault();
    applyPromo(promoInput);
  };

  if (order)
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: EASE }} className="mx-auto max-w-2xl py-20 text-center" role="status">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-gold/50 text-gold-ink">
          <IconMoon size={34} />
        </span>
        <p className="eyebrow mt-8 text-gold-ink">Order {order.id}</p>
        <h1 className="display mt-4 text-5xl sm:text-6xl">Your nights are about to change.</h1>
        <p className="mx-auto mt-6 max-w-md text-stone">
          Thank you, {d.first}. A confirmation is on its way to {order.email}. Your white-glove team will call the day before delivery on {slot && dayFmt.format(new Date(slot))}.
        </p>
        <p className="mt-6 font-serif text-2xl">{formatINR(order.total)}</p>
        <p className="mt-2 text-sm text-gold-ink">+{Math.floor(order.total / 100) * POINTS.perHundredRupees} Sleep Society points</p>
        {order.giftCodes.length > 0 && (
          <div className="mx-auto mt-10 max-w-md border border-gold/40 bg-gold/[0.06] p-6 text-left">
            <p className="eyebrow text-gold-ink">Your gift cards</p>
            <ul className="mt-4 space-y-3 text-sm">
              {order.giftCodes.map((g) => (
                <li key={g.code} className="flex items-center justify-between gap-4">
                  <span>
                    {formatINR(g.amount)} for {g.to || "someone special"}
                    <span className="block font-mono text-xs text-stone">{g.code}</span>
                  </span>
                  <Link href={`/gift/${g.code}`} className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink">
                    Open envelope
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-stone">Share each envelope link with its recipient. The code inside is theirs to spend.</p>
          </div>
        )}
        <p className="mt-6 text-xs text-stone">This is a demonstration checkout; no payment was taken.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/account#orders" className="btn btn-dark">
            Track your order <IconArrow size={16} />
          </Link>
          <Link href="/" className="btn btn-outline">Return home</Link>
        </div>
      </motion.div>
    );

  if (hydrated && !cart.length)
    return (
      <div className="py-24 text-center">
        <p className="display text-5xl">Your bag is resting.</p>
        <p className="mt-3 text-stone">Add a mattress to begin checkout.</p>
        <Link href="/shop" className="btn btn-dark mt-8">Explore mattresses</Link>
      </div>
    );

  return (
    <div className="grid gap-12 py-10 lg:grid-cols-[1.3fr_1fr] lg:gap-20 lg:py-16">
      <div>
        <ol className="flex items-center gap-2 sm:gap-4" aria-label="Checkout progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2 sm:gap-4" aria-current={i === step ? "step" : undefined}>
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                className={cn("flex items-center gap-2 text-xs uppercase tracking-[0.2em] transition-colors duration-700", i <= step ? "text-ink" : "text-ink/35")}
              >
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[0.7rem] transition-all duration-700", i < step ? "border-gold bg-gold text-midnight" : i === step ? "border-midnight" : "border-ink/20")}>
                  {i < step ? <IconCheck size={13} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span className="h-px flex-1 bg-ink/10">
                  <motion.span className="block h-px bg-gold" animate={{ width: i < step ? "100%" : "0%" }} transition={{ duration: 1, ease: EASE }} />
                </span>
              )}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          <motion.section key={step} initial={{ opacity: 0, x: reduce ? 0 : 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -30 }} transition={{ duration: 0.7, ease: EASE }} className="mt-12" aria-labelledby="step-title">
            <h1 id="step-title" className="display text-4xl sm:text-5xl">
              {["Where shall we bring it?", "Choose your delivery day", "How would you like to pay?", "One last look"][step]}
            </h1>

            {step === 0 && hydrated && !profile && (
              <SignInPanel
                className="mt-10"
                title="Sign in to place your order"
                intro="Enter your email and we'll send you a sign-in code. Your order confirmation, invoice and every delivery update will go to this address."
              />
            )}

            {step === 0 && profile && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="eyebrow text-stone">Email</p>
                  <p className="field flex items-center gap-2 !border-transparent !px-0 text-ink">
                    <IconCheck size={14} className="text-gold-ink" aria-hidden /> {profile.email}
                  </p>
                  <p className="mt-1.5 text-xs text-stone">Verified. Your invoice and updates go here.</p>
                </div>
                <Field label="Mobile" type="tel" autoComplete="tel" value={d.phone} onChange={(v) => setD({ ...d, phone: v })} error={errors.phone} />
                <Field label="First name" autoComplete="given-name" value={d.first} onChange={(v) => setD({ ...d, first: v })} error={errors.first} />
                <Field label="Last name" autoComplete="family-name" value={d.last} onChange={(v) => setD({ ...d, last: v })} error={errors.last} />
                <Field label="Address" autoComplete="street-address" value={d.address} onChange={(v) => setD({ ...d, address: v })} error={errors.address} className="sm:col-span-2" />
                <Field label="City" autoComplete="address-level2" value={d.city} onChange={(v) => setD({ ...d, city: v })} error={errors.city} />
                <Field label="Pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={d.pincode} onChange={(v) => setD({ ...d, pincode: v.replace(/\D/g, "") })} error={errors.pincode} />
              </div>
            )}

            {step === 1 && (
              <div className="mt-10">
                {estimate.ok && (
                  <p className="text-sm text-stone">
                    {estimate.whiteGlove ? "Complimentary white-glove delivery" : "Complimentary delivery"} to {d.city || estimate.region}. Our team will set up your bed and take all packaging away.
                  </p>
                )}
                <div role="radiogroup" aria-label="Delivery day" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {dates.map((ds) => (
                    <button key={ds} role="radio" aria-checked={slot === ds} onClick={() => setSlot(ds)} className={cn("border p-4 text-left transition-all duration-700", slot === ds ? "border-midnight bg-midnight text-pearl" : "border-ink/15 hover:border-gold")}>
                      <span className="block font-serif text-xl">{dayFmt.format(new Date(ds))}</span>
                      <span className={cn("block text-xs", slot === ds ? "text-pearl/60" : "text-stone")}>10am – 6pm window</span>
                    </button>
                  ))}
                </div>
                {errors.slot && <p className="mt-3 text-xs text-[#9a5a4a]">{errors.slot}</p>}
                {!hasRemovalInCart && (
                  <label className="mt-8 flex cursor-pointer items-start gap-4 border border-ink/10 p-5">
                    <input type="checkbox" checked={removal} onChange={(e) => setRemoval(e.target.checked)} className="mt-1 accent-[#0e1420]" />
                    <span className="flex-1">
                      <span className="block">Take away my old mattress</span>
                      <span className="block text-sm text-stone">Responsibly recycled or donated.</span>
                    </span>
                    <span className="text-sm">{formatINR(site.commerce.removalFee)}</span>
                  </label>
                )}
                <label className="mt-6 block">
                  <span className="eyebrow text-stone">A note for your delivery team (optional)</span>
                  <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="field resize-none" placeholder="Third floor, please call on arrival…" />
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="mt-10">
                <div role="radiogroup" aria-label="Payment method" className="space-y-3">
                  {PAY.map((p) => (
                    <div key={p.id} className={cn("border transition-all duration-700", pay === p.id ? "border-midnight" : "border-ink/15 hover:border-gold")}>
                      <button role="radio" aria-checked={pay === p.id} onClick={() => setPay(p.id)} className="flex w-full items-center gap-4 p-5 text-left">
                        <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full border", pay === p.id ? "border-midnight bg-midnight" : "border-ink/30")}>
                          {pay === p.id && <span className="h-2 w-2 rounded-full bg-gold" />}
                        </span>
                        <span className="flex-1">
                          <span className="flex items-center gap-3">
                            <span className="font-serif text-xl">{p.title}</span>
                            {p.badge && <span className="bg-gold/20 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">{p.badge}</span>}
                          </span>
                          <span className="block text-sm text-stone">{p.note}</span>
                        </span>
                        {p.id === "emi" && <span className="hidden text-right text-sm sm:block">from <strong className="font-semibold">{formatINR(emiFrom(total))}</strong>/mo</span>}
                      </button>
                      <AnimatePresence initial={false}>
                        {pay === p.id && (p.id === "emi" || p.id === "later") && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.7, ease: EASE }} className="overflow-hidden">
                            <div className="grid gap-2 px-5 pb-5 sm:grid-cols-3">
                              {(p.id === "emi" ? [3, 6, 12] : [3]).map((m) => (
                                <button key={m} onClick={() => setMonths(m)} aria-pressed={p.id === "later" || months === m} className={cn("border p-3 text-left transition-colors duration-500", p.id === "later" || months === m ? "border-gold bg-gold/10" : "border-ink/10 hover:border-gold")}>
                                  <span className="block font-serif text-2xl">{formatINR(emiFrom(total, m))}</span>
                                  <span className="block text-xs text-stone">× {m} {p.id === "emi" ? "months · 0% interest" : "instalments"}</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
                <p className="mt-6 flex items-center gap-2 text-xs text-stone">
                  <IconLock size={14} className="text-gold-ink" /> You&rsquo;ll complete payment securely with our payment partner. Card details never touch our servers.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="mt-10 space-y-6 text-sm">
                {[
                  { k: "Contact", v: `${d.first} ${d.last} · ${d.email} · ${d.phone}`, s: 0 },
                  { k: "Deliver to", v: `${d.address}, ${d.city} ${d.pincode}`, s: 0 },
                  { k: "Delivery day", v: `${slot ? dayFmt.format(new Date(slot)) : ""}, white-glove${removal ? " · old mattress removal" : ""}`, s: 1 },
                  { k: "Payment", v: pay === "emi" ? `No-cost EMI · ${formatINR(emiFrom(total, months))} × ${months} months` : PAY.find((p) => p.id === pay)!.title, s: 2 },
                ].map((r) => (
                  <div key={r.k} className="flex items-start justify-between gap-6 border-b border-ink/10 pb-5">
                    <div>
                      <p className="eyebrow text-stone">{r.k}</p>
                      <p className="mt-1.5">{r.v}</p>
                    </div>
                    <button onClick={() => setStep(r.s)} className="text-xs uppercase tracking-[0.2em] text-gold-ink hover:text-ink">Edit</button>
                  </div>
                ))}
                <form onSubmit={onPromo} className="pt-2">
                  <label htmlFor="promo" className="eyebrow text-stone">Gift card or referral code</label>
                  <div className="mt-1 flex items-end gap-3">
                    <input id="promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="GIFT-XXXX-XXXX or SHK-…" className="field flex-1 uppercase" autoComplete="off" />
                    <button type="submit" className="pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink">Apply</button>
                  </div>
                  {promoError && <p className="mt-2 text-xs text-[#9a5a4a]" role="alert">{promoError}</p>}
                  {promo && (
                    <p className="mt-2 flex items-center gap-2 text-xs text-gold-ink" role="status">
                      <IconCheck size={14} /> {promo.label}: −{formatINR(discount)}
                      <button type="button" onClick={() => setPromo(null)} className="ml-2 text-stone underline-offset-4 hover:underline">Remove</button>
                    </p>
                  )}
                </form>
              </div>
            )}
            {placeError && (
              <p className="mt-6 text-sm text-[#9a5a4a]" role="alert">
                {placeError}{" "}
                <a href={site.contact.whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  WhatsApp us
                </a>
              </p>
            )}

            <div className="mt-12 flex items-center justify-between gap-4">
              {step > 0 ? (
                <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
                  <IconArrowLeft size={14} /> Back
                </button>
              ) : (
                <Link href="/shop" className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
                  <IconArrowLeft size={14} /> Continue shopping
                </Link>
              )}
              {step === 0 && !profile ? null : step < 3 ? (
                <button className="btn btn-dark" onClick={next}>
                  Continue to {STEPS[step + 1].toLowerCase()}
                </button>
              ) : (
                <button className="btn btn-gold" onClick={place} disabled={placing} aria-busy={placing}>
                  <IconLock size={16} /> {placing ? "Placing your order…" : `Place order · ${formatINR(total)}`}
                </button>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      <aside className="h-fit border border-ink/10 bg-ivory-2/50 p-6 sm:p-8 lg:sticky lg:top-8" aria-label="Order summary">
        <h2 className="text-2xl">Your order</h2>
        {!hydrated ? (
          <div className="skeleton mt-6 h-40" />
        ) : (
          <>
            <ul className="mt-6 space-y-5">
              {cart.map((c) => (
                <li key={c.key} className="flex gap-4">
                  <div className="relative shrink-0">
                    <Img src={c.image} alt="" sizes="64px" wrapperClassName="h-16 w-14" />
                    <span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-midnight text-[0.6rem] text-pearl">{c.qty}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-lg leading-tight">{c.name}</p>
                    {c.detail && <p className="truncate text-xs text-stone">{c.detail}</p>}
                  </div>
                  <p className="text-sm">{formatINR(c.price * c.qty)}</p>
                </li>
              ))}
              {gift && (
                <li className="flex items-center gap-4 text-sm">
                  <span className="grid h-16 w-14 shrink-0 place-items-center bg-gold/15 text-gold-ink"><IconGift size={22} /></span>
                  <span className="flex-1">Cloud Pillows, pair<span className="block text-xs text-stone">With our compliments</span></span>
                  <span className="text-gold-ink">Free</span>
                </li>
              )}
            </ul>
            {!gift && (
              <div className="mt-6">
                <GiftProgress subtotal={subtotal} />
              </div>
            )}
            <dl className="mt-8 space-y-2 border-t border-ink/10 pt-6 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
              {removalFee > 0 && <div className="flex justify-between"><dt className="text-stone">Old-mattress removal</dt><dd>{formatINR(removalFee)}</dd></div>}
              {discount > 0 && <div className="flex justify-between text-gold-ink"><dt>{promo?.label}</dt><dd>−{formatINR(discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-stone">White-glove delivery</dt><dd className="text-gold-ink">Complimentary</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-4 text-base"><dt>Total</dt><dd className="font-serif text-3xl">{formatINR(total)}</dd></div>
            </dl>
            <p className="mt-3 text-right text-xs text-stone">or {formatINR(emiFrom(total))}/mo with no-cost EMI · incl. GST</p>
          </>
        )}
        <div className="mt-8 border-t border-ink/10 pt-6">
          <TrustBadges />
        </div>
      </aside>
    </div>
  );
}
