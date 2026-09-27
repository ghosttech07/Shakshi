import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudio } from "@/lib/server/studio";
import { get } from "@/lib/server/db";
import { stageOf } from "@/lib/server/studio-data";
import { STAGES, stageTimes, type OrderData } from "@shakshi/shared/orders";
import { SIZES } from "@shakshi/shared/products";
import { Badge, PageHead, inr, when } from "@/components/studio/ui";
import { OrderStage } from "@/components/studio/OrderStage";

export const metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const base = await requireStudio();
  const id = decodeURIComponent((await params).id);
  const o = await get<OrderData>("orders", id);
  if (!o) notFound();
  const d = o.data;
  const c = d.customer;
  const stage = stageOf(o);
  const times = stageTimes(o.created_at, d.deliveryDate);
  const at = STAGES.findIndex((s) => s.id === stage);
  const phone = (c.phone ?? "").replace(/[^\d]/g, "");
  const wa = phone ? `https://wa.me/${phone.length === 10 ? `91${phone}` : phone}?text=${encodeURIComponent(`Hello ${c.first}, this is the Shakshi atelier about your order ${o.id}.`)}` : "";

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href={`${base}/orders`} className="text-stone hover:text-ink">
          ← Orders
        </Link>
      </p>
      <PageHead eyebrow={`Placed ${when(o.created_at)}`} title={o.id} actions={<Badge tone={stage === "delivered" ? "ok" : "gold"}>{STAGES[at]?.admin}</Badge>} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="text-2xl">Items</h2>
            <ul className="mt-3 divide-y divide-ink/[0.06]">
              {d.items.map((i) => (
                <li key={i.key} className="flex flex-wrap justify-between gap-3 py-3">
                  <span>
                    <span className="font-semibold">{i.name}</span>
                    {i.qty > 1 && <span className="text-stone"> × {i.qty}</span>}
                    <span className="block text-xs text-stone">{[i.size && SIZES.find((s) => s.id === i.size)?.label, i.detail].filter(Boolean).join(" · ")}</span>
                    {i.gift && <span className="block text-xs text-stone">Gift for {i.gift.to}{i.gift.message ? `: “${i.gift.message}”` : ""}</span>}
                  </span>
                  <span className="tabular-nums">{inr(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-stone">Subtotal</dt><dd className="tabular-nums">{inr(d.subtotal)}</dd></div>
              {d.removal > 0 && <div className="flex justify-between"><dt className="text-stone">Old-mattress removal</dt><dd className="tabular-nums">{inr(d.removal)}</dd></div>}
              {d.discount > 0 && <div className="flex justify-between"><dt className="text-stone">{d.discountLabel ?? "Discount"}{d.promoCode ? ` (${d.promoCode})` : ""}</dt><dd className="tabular-nums">−{inr(d.discount)}</dd></div>}
              <div className="flex justify-between pt-1 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{inr(d.total)}</dd></div>
              <div className="flex justify-between text-stone"><dt>Payment</dt><dd>{d.payment || "—"}{d.months ? `, ${d.months} months` : ""}</dd></div>
            </dl>
            {d.giftCodes?.length ? (
              <p className="mt-3 text-sm text-stone">Gift cards issued: {d.giftCodes.map((g) => `${g.code} (${inr(g.amount)} for ${g.to})`).join(", ")}</p>
            ) : null}
            {d.madeToOrder && <p className="mt-3 text-sm text-warn">Beyond ready stock: handcrafted to order, so allow the longer lead time.</p>}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-2xl">Delivery timeline</h2>
            <p className="text-xs text-stone">What the customer sees on their order page.</p>
            <ol className="mt-4 space-y-4">
              {STAGES.map((s, i) => (
                <li key={s.id} className="flex gap-4">
                  <span aria-hidden className={`mt-1 h-3 w-3 shrink-0 rounded-full border ${i <= at ? "border-gold bg-gold" : "border-ink/25"}`} />
                  <div>
                    <p className={i <= at ? "font-semibold" : "text-stone"}>
                      {s.admin} {i === at && <span className="ml-1 text-xs font-normal text-gold-ink">(current)</span>}
                    </p>
                    <p className="text-xs text-stone">{d.statusMode === "manual" && i > at ? "Waiting" : when(times[s.id].toISOString())}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <OrderStage id={o.id} stage={stage} mode={d.statusMode} />
            <p className="mt-4 text-sm">
              Delivery due <strong>{when(d.deliveryDate, false)}</strong>
            </p>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="text-2xl">Customer</h2>
            <p className="mt-2 font-semibold">
              {c.first} {c.last}
            </p>
            <p className="text-sm text-stone">
              {c.address}
              <br />
              {c.city} {c.pincode}
            </p>
            <p className="mt-3 text-sm">
              <a href={`mailto:${c.email}`} className="text-gold-ink hover:underline">{c.email}</a>
              <br />
              <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-sm">WhatsApp</a>}
              <Link href={`${base}/customers/${encodeURIComponent(c.email)}`} className="btn btn-line btn-sm">Customer history</Link>
            </div>
            {d.note && <p className="mt-4 rounded-md bg-ivory-2 p-3 text-sm">“{d.note}”</p>}
          </section>
        </div>
      </div>
    </>
  );
}
