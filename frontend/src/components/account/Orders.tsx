"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { useAccount, type LocalOrder } from "@/lib/account";
import { CHECK_INS, STAGES, TRIAL_NIGHTS, currentStage, stageTimes, type StageId } from "@shakshi/shared/orders";
import { EASE, cn, formatINR } from "@shakshi/shared/utils";
import { Img } from "@/components/ui/Img";
import { IconCheck, IconShield, IconArrow, IconMoon } from "@/components/ui/Icons";

const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

type Tracking = { stage: StageId; times: Record<StageId, string | Date> };

/** Live status from the server (so the atelier's updates show), or computed locally for the sample order. */
function useTracking(o: LocalOrder): Tracking | null {
  const [t, setT] = useState<Tracking | null>(null);
  useEffect(() => {
    if (o.sample) {
      const row = { created_at: o.createdAt, status: null, data: { deliveryDate: o.deliveryDate, statusMode: "auto" as const } };
      setT({ stage: currentStage(row), times: stageTimes(o.createdAt, o.deliveryDate) });
      return;
    }
    let alive = true;
    fetch(`/api/orders/${encodeURIComponent(o.id)}?token=${encodeURIComponent(o.token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && j && setT({ stage: j.stage, times: j.times }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [o]);
  return t;
}

function Timeline({ tracking }: { tracking: Tracking }) {
  const idx = STAGES.findIndex((s) => s.id === tracking.stage);
  return (
    <ol className="relative mt-8 grid gap-6 sm:grid-cols-5 sm:gap-2" aria-label="Delivery progress">
      <span className="absolute left-[11px] top-3 h-[calc(100%-1.5rem)] w-px bg-ink/10 sm:left-3 sm:right-3 sm:top-[11px] sm:h-px sm:w-auto" aria-hidden />
      <motion.span
        className="absolute left-[11px] top-3 w-px origin-top bg-gold sm:hidden"
        initial={{ height: 0 }}
        animate={{ height: `calc(${(idx / (STAGES.length - 1)) * 100}% - 1.5rem)` }}
        transition={{ duration: 1.4, ease: EASE }}
        aria-hidden
      />
      <motion.span
        className="absolute left-3 top-[11px] hidden h-px origin-left bg-gold sm:block"
        initial={{ width: 0 }}
        animate={{ width: `calc(${(idx / (STAGES.length - 1)) * 100}% - 1.5rem)` }}
        transition={{ duration: 1.4, ease: EASE }}
        aria-hidden
      />
      {STAGES.map((s, i) => {
        const done = i <= idx;
        const when = new Date(tracking.times[s.id]);
        return (
          <li key={s.id} className="relative flex gap-4 sm:flex-col sm:gap-3" aria-current={i === idx ? "step" : undefined}>
            <span className={cn("relative z-[1] grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors duration-700", done ? "border-gold bg-gold text-midnight" : "border-ink/20 bg-ivory")}>
              {done ? <IconCheck size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-ink/20" />}
              {i === idx && i < STAGES.length - 1 && <span className="absolute inset-0 animate-ping rounded-full border border-gold [animation-duration:2.4s]" aria-hidden />}
            </span>
            <div>
              <p className={cn("text-sm", done ? "text-ink" : "text-stone")}>{s.label}</p>
              <p className="text-xs text-stone">{done ? timeFmt.format(when) : `Expected ${dayFmt.format(when)}`}</p>
              {i === idx && <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-stone">{s.note}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Warranty({ order }: { order: LocalOrder }) {
  const reg = useAccount((s) => s.warranties[order.id]);
  const register = useAccount((s) => s.registerWarranty);
  const profile = useAccount((s) => s.profile);
  const [serial, setSerial] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mattress = order.items.find((i) => i.kind === "mattress");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (order.sample) {
        if (!/^[A-Z0-9-]{6,40}$/i.test(serial)) throw new Error("Please check the serial number on your mattress label.");
        register(order.id, { id: `W-SAMPLE-${serial.slice(-4).toUpperCase()}`, serial: serial.toUpperCase(), registeredAt: new Date().toISOString() });
        return;
      }
      const res = await fetch("/api/warranty", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, token: order.token, serial, name: profile?.name ?? "Customer", product: mattress?.name }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      register(order.id, { id: j.id, serial: serial.toUpperCase(), registeredAt: j.registeredAt });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!mattress) return null;
  if (reg)
    return (
      <p className="flex items-start gap-3 text-sm">
        <IconShield size={20} className="shrink-0 text-gold-ink" />
        <span>
          10-year warranty registered · <span className="font-mono text-xs">{reg.serial}</span>
          <span className="block text-xs text-stone">Covered until {new Date(new Date(reg.registeredAt).getTime() + 3652 * 86400000).toLocaleDateString("en-IN", { month: "long", year: "numeric" })} · ref {reg.id.slice(0, 8)}</span>
        </span>
      </p>
    );
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="min-w-[14rem] flex-1">
        <span className="eyebrow text-stone">Register your 10-year warranty</span>
        <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Serial on the label, e.g. NTC-2609-4471" className="field uppercase" />
      </label>
      <button type="submit" disabled={busy} className="btn btn-outline !py-3">
        Register
      </button>
      {error && <p className="w-full text-xs text-[#9a5a4a]" role="alert">{error}</p>}
    </form>
  );
}

function Trial({ order, deliveredAt }: { order: LocalOrder; deliveredAt: Date }) {
  const night = Math.max(1, Math.min(TRIAL_NIGHTS, Math.floor((Date.now() - deliveredAt.getTime()) / 86400000) + 1));
  const left = TRIAL_NIGHTS - night;
  const r = 44;
  const c = 2 * Math.PI * r;
  const due = [...CHECK_INS].reverse().find((k) => night >= k.night);
  return (
    <div className="mt-8 grid gap-8 border-t border-ink/10 pt-8 md:grid-cols-[auto_1fr] md:gap-12">
      <div className="flex items-center gap-5">
        <svg width="108" height="108" viewBox="0 0 108 108" className="-rotate-90" role="img" aria-label={`Night ${night} of ${TRIAL_NIGHTS}`}>
          <circle cx="54" cy="54" r={r} fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="3" />
          <motion.circle cx="54" cy="54" r={r} fill="none" stroke="#c9a96e" strokeWidth="3" strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c - (night / TRIAL_NIGHTS) * c }} transition={{ duration: 1.8, ease: EASE }} />
        </svg>
        <div>
          <p className="eyebrow text-stone">100-night trial</p>
          <p className="font-serif text-4xl">Night {night}</p>
          <p className="text-xs text-stone">{left > 0 ? `${left} nights to decide` : "Your trial is complete. Sleep well."}</p>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {CHECK_INS.map((k) => {
          const open = night >= k.night;
          return (
            <li key={k.night} className={cn("border p-4 transition-colors duration-700", due?.night === k.night ? "border-gold bg-gold/[0.07]" : open ? "border-ink/15" : "border-dashed border-ink/15 opacity-60")}>
              <p className="eyebrow text-gold-ink">Night {k.night}</p>
              <p className="mt-2 font-serif text-xl">{k.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-stone">{open ? k.body : `Opens on ${dayFmt.format(new Date(deliveredAt.getTime() + (k.night - 1) * 86400000))}`}</p>
              {due?.night === k.night && (
                <Link href="#journal" className="mt-3 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink">
                  Log last night <IconArrow size={12} />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OrderCard({ order }: { order: LocalOrder }) {
  const tracking = useTracking(order);
  const delivered = tracking?.stage === "delivered";
  const lead = order.items.find((i) => i.kind === "mattress") ?? order.items[0];
  return (
    <article className="border border-ink/10 bg-ivory p-6 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          {lead && <Img src={lead.image} alt="" sizes="72px" wrapperClassName="h-20 w-16 shrink-0" />}
          <div>
            <p className="eyebrow text-stone">
              Order {order.id}
              {order.sample && <span className="ml-2 rounded bg-ink/10 px-1.5 py-0.5 text-[0.6rem] tracking-[0.15em]">Sample</span>}
            </p>
            <p className="mt-1 font-serif text-2xl">{lead?.name}</p>
            <p className="text-xs text-stone">
              {order.items.length} item{order.items.length > 1 ? "s" : ""} · {formatINR(order.total)} · placed {dayFmt.format(new Date(order.createdAt))}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em]">
          <Link href={`/account/invoice/${encodeURIComponent(order.id)}`} className="text-gold-ink hover:text-ink">
            Invoice
          </Link>
          {(delivered || tracking?.stage === "out_for_delivery") && (
            <Link href="/setup" className="text-gold-ink hover:text-ink">
              Setup guide
            </Link>
          )}
        </div>
      </header>
      {tracking ? <Timeline tracking={tracking} /> : <div className="skeleton mt-8 h-16" />}
      {delivered && tracking && <Trial order={order} deliveredAt={new Date(tracking.times.delivered)} />}
      <div className="mt-8 border-t border-ink/10 pt-6">
        <Warranty order={order} />
      </div>
      {order.giftCodes && order.giftCodes.length > 0 && (
        <p className="mt-6 text-sm">
          Gift cards in this order:{" "}
          {order.giftCodes.map((g) => (
            <Link key={g.code} href={`/gift/${g.code}`} className="link-lux mr-3 font-mono text-xs">
              {g.code}
            </Link>
          ))}
        </p>
      )}
    </article>
  );
}

export function Orders() {
  const orders = useAccount((s) => s.orders);
  const addOrder = useAccount((s) => s.addOrder);

  const addSample = () => {
    const now = Date.now();
    addOrder({
      id: "SAMPLE-4471",
      token: "sample",
      sample: true,
      createdAt: new Date(now - 17 * 86400000).toISOString(),
      deliveryDate: new Date(now - 12 * 86400000).toISOString(),
      total: 98800,
      items: [
        { key: "signature-queen", kind: "mattress", ref: "signature", name: "The Shakshi Signature", detail: "Queen · 152 × 198 cm · Medium", image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39", size: "queen", price: 89900, qty: 1 },
        { key: "pillows", kind: "accessory", ref: "pillows", name: "Cloud Pillow, pair", detail: "Down-alternative, adjustable loft", image: "https://images.unsplash.com/photo-1629949009765-40fc74c9ec21", price: 8900, qty: 1 },
      ],
    });
  };

  return (
    <section id="orders" className="scroll-mt-28" aria-labelledby="orders-title">
      <h2 id="orders-title" className="display text-4xl">
        Your orders
      </h2>
      {orders.length ? (
        <div className="mt-8 space-y-6">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      ) : (
        <div className="mt-8 border border-dashed border-ink/20 p-10 text-center">
          <IconMoon size={34} className="mx-auto text-gold-ink" />
          <p className="mt-5 font-serif text-2xl">No orders yet.</p>
          <p className="mt-2 text-sm text-stone">When you order, you&rsquo;ll follow it here from our atelier to your bedroom.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn btn-dark">
              Explore mattresses
            </Link>
            <button onClick={addSample} className="btn btn-outline">
              Preview with a sample order
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
