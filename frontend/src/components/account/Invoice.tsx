"use client";

import Link from "next/link";
import { useAccount } from "@/lib/account";
import { useHydrated } from "@/lib/useHydrated";
import { useSite } from "@/lib/site-context";
import { Logo } from "@/components/brand/Logo";
import { formatINR } from "@shakshi/shared/utils";

const GST = 0.18; // prices include GST
const HSN: Record<string, string> = { mattress: "9404", bundle: "9403", accessory: "9404", addon: "9985", giftcard: "—" };
const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

/** A printable tax invoice for an order kept on this device. "Download" uses the browser's Save as PDF. */
export function Invoice({ id }: { id: string }) {
  const hydrated = useHydrated();
  const order = useAccount((s) => s.orders.find((o) => o.id === id));
  const profile = useAccount((s) => s.profile);
  const { brand, contact: settings } = useSite();

  if (!hydrated) return <div className="skeleton h-[70vh]" />;
  if (!order)
    return (
      <div className="py-24 text-center">
        <p className="display text-4xl">We couldn&rsquo;t find that order on this device.</p>
        <Link href="/account#orders" className="btn btn-dark mt-8">
          Back to your orders
        </Link>
      </div>
    );

  const c = order.customer;
  const lines = order.items.map((i) => {
    const gross = i.price * i.qty;
    const taxable = i.kind === "giftcard" ? gross : gross / (1 + GST);
    return { ...i, gross, taxable, tax: gross - taxable };
  });
  const taxable = lines.reduce((s, l) => s + l.taxable, 0);
  const tax = lines.reduce((s, l) => s + l.tax, 0);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden" data-no-print>
        <Link href="/account#orders" className="text-xs uppercase tracking-[0.2em] text-stone hover:text-ink">
          ← Your orders
        </Link>
        <button onClick={() => print()} className="btn btn-dark">
          Download PDF
        </button>
      </div>

      <article className="invoice mx-auto max-w-3xl bg-white p-8 text-[#1c2230] shadow-soft sm:p-12 print:max-w-none print:p-0 print:shadow-none" aria-label={`Tax invoice for order ${order.id}`}>
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#1c2230]/15 pb-8">
          <Logo variant="lockup" className="h-16 [background-color:#eb0202]!" />
          <div className="text-right text-sm">
            <p className="font-serif text-3xl">Tax invoice</p>
            <p className="mt-2">No. {order.id}</p>
            <p>{dateFmt.format(new Date(order.createdAt))}</p>
            {order.sample && <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#9a5a4a]">Sample · not a real invoice</p>}
          </div>
        </header>

        <section className="grid gap-8 py-8 text-sm sm:grid-cols-2">
          <div>
            <p className="eyebrow text-[#6b635a]">Sold by</p>
            <p className="mt-2 font-semibold">{brand.name}</p>
            <p>{settings.address}</p>
            <p>GSTIN: to be added</p>
          </div>
          <div>
            <p className="eyebrow text-[#6b635a]">Billed to</p>
            {c ? (
              <>
                <p className="mt-2 font-semibold">
                  {c.first} {c.last}
                </p>
                <p>{c.address}</p>
                <p>
                  {c.city} {c.pincode}
                </p>
                <p>{c.email}</p>
              </>
            ) : (
              <p className="mt-2">{profile?.name ?? "Customer"}</p>
            )}
          </div>
        </section>

        <table className="w-full text-left text-sm">
          <caption className="sr-only">Items</caption>
          <thead className="border-y border-[#1c2230]/15 text-xs uppercase tracking-[0.12em] text-[#6b635a]">
            <tr>
              <th scope="col" className="py-3 font-semibold">Item</th>
              <th scope="col" className="py-3 font-semibold">HSN/SAC</th>
              <th scope="col" className="py-3 text-right font-semibold">Qty</th>
              <th scope="col" className="py-3 text-right font-semibold">Taxable</th>
              <th scope="col" className="py-3 text-right font-semibold">GST 18%</th>
              <th scope="col" className="py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.key} className="border-b border-[#1c2230]/10 align-top">
                <td className="py-3 pr-3">
                  {l.name}
                  {l.detail && <span className="block text-xs text-[#6b635a]">{l.detail}</span>}
                </td>
                <td className="py-3">{HSN[l.kind] ?? "9404"}</td>
                <td className="py-3 text-right">{l.qty}</td>
                <td className="py-3 text-right tabular-nums">{formatINR(Math.round(l.taxable))}</td>
                <td className="py-3 text-right tabular-nums">{formatINR(Math.round(l.tax))}</td>
                <td className="py-3 text-right tabular-nums">{formatINR(l.gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#6b635a]">Taxable value</dt>
            <dd className="tabular-nums">{formatINR(Math.round(taxable))}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#6b635a]">GST (CGST 9% + SGST 9%)</dt>
            <dd className="tabular-nums">{formatINR(Math.round(tax))}</dd>
          </div>
          {!!order.removal && (
            <div className="flex justify-between">
              <dt className="text-[#6b635a]">Old-mattress removal</dt>
              <dd className="tabular-nums">{formatINR(order.removal)}</dd>
            </div>
          )}
          {!!order.discount && (
            <div className="flex justify-between">
              <dt className="text-[#6b635a]">Discount</dt>
              <dd className="tabular-nums">−{formatINR(order.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-[#1c2230]/15 pt-2 text-base font-semibold">
            <dt>Total paid</dt>
            <dd className="tabular-nums">{formatINR(order.total)}</dd>
          </div>
        </dl>

        <footer className="mt-12 border-t border-[#1c2230]/15 pt-6 text-xs leading-relaxed text-[#6b635a]">
          <p>Includes your 100-night trial and 10-year warranty. Keep this invoice for warranty claims.</p>
          <p>
            Questions? {settings.phone} · {settings.email}
          </p>
        </footer>
      </article>
    </>
  );
}
