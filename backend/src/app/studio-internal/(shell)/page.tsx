import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { overview, stageOf } from "@/lib/server/studio-data";
import { getCatalog } from "@/lib/server/catalog";
import { STAGES } from "@shakshi/shared/orders";
import { SIZES } from "@shakshi/shared/products";
import { Badge, PageHead, Stat, ago, inr } from "@/components/studio/ui";
import { RevenueChart } from "@/components/studio/RevenueChart";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const base = await requireStudio();
  const [o, catalog] = await Promise.all([overview(), getCatalog({ includeUnpublished: true })]);
  const nameOf = (key: string) => {
    const [slug, size] = key.split(":");
    return `${catalog.find((p) => p.slug === slug)?.name ?? slug} · ${SIZES.find((s) => s.id === size)?.label ?? size}`;
  };
  const top = Math.max(1, o.funnel[0].n);
  const hour = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));

  return (
    <>
      <PageHead eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })} title={hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening."} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Today's orders" value={o.todayOrders} note={inr(o.todayRevenue)} href={`${base}/orders`} />
        <Stat label="Revenue this week" value={inr(o.weekRevenue)} note="Since Monday" />
        <Stat label="Revenue this month" value={inr(o.monthRevenue)} />
        <Stat label="Pending deliveries" value={o.pending} note="Not yet delivered" href={`${base}/orders?stage=open`} />
        <Stat label="Low stock" value={o.lowStock.length} note="Sizes with 3 or fewer" tone={o.lowStock.length ? "warn" : undefined} href={`${base}/products`} />
        <Stat label="Quiz completions" value={o.quizCompletions} note="Last 30 days" href={`${base}/customers`} />
        <Stat label="Upcoming bookings" value={o.upcomingBookings} note="Salon, home and video" href={`${base}/bookings`} />
        <Stat label="Configurator sessions" value={o.configuratorUses} note="Last 30 days" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="rev-title">
          <h2 id="rev-title" className="text-2xl">
            Daily revenue
          </h2>
          <p className="text-xs text-stone">Last 30 days, all orders (sample orders excluded)</p>
          <div className="mt-4">
            <RevenueChart days={o.days} />
          </div>
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="funnel-title">
          <h2 id="funnel-title" className="text-2xl">
            How visitors move
          </h2>
          <p className="text-xs text-stone">Unique sessions, last 30 days</p>
          <ol className="mt-5 space-y-3">
            {o.funnel.map((s, i) => (
              <li key={s.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-stone">
                    {s.n.toLocaleString("en-IN")}
                    {i > 0 && o.funnel[i - 1].n > 0 && <span className="ml-2 text-xs">({Math.round((s.n / o.funnel[i - 1].n) * 100)}%)</span>}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-ink/[0.06]">
                  <div className="h-2 rounded-full bg-chart" style={{ width: `${(s.n / top) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="recent-title">
          <div className="flex items-center justify-between">
            <h2 id="recent-title" className="text-2xl">
              Latest orders
            </h2>
            <Link href={`${base}/orders`} className="text-xs font-semibold text-gold-ink hover:underline">
              All orders →
            </Link>
          </div>
          {o.recent.length ? (
            <ul className="mt-3 divide-y divide-ink/[0.06]">
              {o.recent.map((r) => (
                <li key={r.id}>
                  <Link href={`${base}/orders/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-gold-ink">
                    <span>
                      <span className="font-semibold">{r.id}</span> · {r.data.customer?.first} {r.data.customer?.last}
                      <span className="ml-2 text-xs text-stone">{ago(r.created_at)}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge tone="gold">{STAGES.find((s) => s.id === stageOf(r))?.admin}</Badge>
                      <span className="tabular-nums">{inr(r.data.total)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-stone">No orders yet.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6" aria-labelledby="stock-title">
          <h2 id="stock-title" className="text-2xl">
            Low-stock alerts
          </h2>
          {o.lowStock.length ? (
            <ul className="mt-3 space-y-2">
              {o.lowStock.map((s) => (
                <li key={s.key} className="flex items-center justify-between gap-3">
                  <span>{nameOf(s.key)}</span>
                  <Badge tone={s.qty === 0 ? "bad" : "warn"}>{s.qty === 0 ? "Out of stock" : `${s.qty} left`}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-stone">Every tracked size is comfortably stocked. Sizes without a count are made to order.</p>
          )}
        </section>
      </div>
    </>
  );
}
