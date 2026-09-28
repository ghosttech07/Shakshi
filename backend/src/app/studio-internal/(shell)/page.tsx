import Link from "next/link";
import { after } from "next/server";
import { catchUpOrderEmails } from "@/lib/server/order-email";
import { requireStudio } from "@/lib/server/studio";
import { overview, stageOf } from "@/lib/server/studio-data";
import { getCatalog } from "@/lib/server/catalog";
import { STAGES } from "@shakshi/shared/orders";
import { SIZES } from "@shakshi/shared/products";
import { Badge, PageHead, Stat, ago, inr } from "@/components/studio/ui";
import { RevenueChart } from "@/components/studio/RevenueChart";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const base = await requireStudio();
  // Orders on the automatic calendar change stage by date: email customers about any new stage (after the page is sent)
  after(() => catchUpOrderEmails().catch(() => null));
  const [o, catalog] = await Promise.all([overview(), getCatalog({ includeUnpublished: true })]);
  const nameOf = (key: string) => {
    const [slug, size] = key.split(":");
    return `${catalog.find((p) => p.slug === slug)?.name ?? slug}, ${SIZES.find((s) => s.id === size)?.label ?? size}`;
  };
  const hour = Number(new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }));

  // Everything that's waiting on someone, most useful first. Only non-zero items are shown.
  const todo = [
    { n: o.pendingReviews, text: (n: number) => `${n} review${n === 1 ? "" : "s"} to approve`, href: `${base}/reviews` },
    { n: o.openInquiries, text: (n: number) => `${n} message${n === 1 ? "" : "s"} waiting for a reply`, href: `${base}/inquiries` },
    { n: o.bookingsToConfirm, text: (n: number) => `${n} booking${n === 1 ? "" : "s"} to confirm`, href: `${base}/bookings` },
    { n: o.pending, text: (n: number) => `${n} order${n === 1 ? "" : "s"} still to deliver`, href: `${base}/orders?stage=open` },
    { n: o.lowStock.length, text: (n: number) => `${n} mattress size${n === 1 ? "" : "s"} running low`, href: `${base}/products` },
    { n: o.openCarts, text: (n: number) => `${n} unfinished checkout${n === 1 ? "" : "s"} to follow up`, href: `${base}/carts` },
  ].filter((t) => t.n > 0);

  return (
    <>
      <PageHead
        eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}
        title={hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}
      />

      <section className="card mb-6 p-5 sm:p-6" aria-labelledby="todo-title">
        <h2 id="todo-title" className="text-lg">
          Needs your attention
        </h2>
        {todo.length ? (
          <ul className="mt-3 divide-y divide-ink/[0.06]">
            {todo.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className="flex items-center justify-between gap-3 py-3 hover:text-gold-ink">
                  <span className="flex items-center gap-3">
                    <span aria-hidden className="h-2 w-2 rounded-full bg-gold" />
                    {t.text(t.n)}
                  </span>
                  <span className="text-sm text-stone">Open →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-stone">Nothing waiting. Everything is up to date.</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders today" value={o.todayOrders} note={inr(o.todayRevenue)} href={`${base}/orders`} />
        <Stat label="Sales this week" value={inr(o.weekRevenue)} note="Since Monday" />
        <Stat label="Sales this month" value={inr(o.monthRevenue)} />
        <Stat label="Upcoming bookings" value={o.upcomingBookings} href={`${base}/bookings`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6" aria-labelledby="rev-title">
          <h2 id="rev-title" className="text-lg">
            Sales, last 30 days
          </h2>
          <p className="text-sm text-stone">Hover a bar to see the day&rsquo;s total.</p>
          <div className="mt-4">
            <RevenueChart days={o.days} />
          </div>
        </section>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="recent-title">
            <div className="flex items-center justify-between">
              <h2 id="recent-title" className="text-lg">
                Latest orders
              </h2>
              <Link href={`${base}/orders`} className="text-sm font-semibold text-gold-ink hover:underline">
                All orders →
              </Link>
            </div>
            {o.recent.length ? (
              <ul className="mt-2 divide-y divide-ink/[0.06]">
                {o.recent.map((r) => (
                  <li key={r.id}>
                    <Link href={`${base}/orders/${r.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-gold-ink">
                      <span>
                        <span className="font-semibold">
                          {r.data.customer?.first} {r.data.customer?.last}
                        </span>
                        <span className="ml-2 text-sm text-stone">{ago(r.created_at)}</span>
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
              <p className="mt-2 text-stone">No orders yet.</p>
            )}
          </section>

          {o.lowStock.length > 0 && (
            <section className="card p-5 sm:p-6" aria-labelledby="stock-title">
              <h2 id="stock-title" className="text-lg">
                Running low
              </h2>
              <ul className="mt-2 space-y-2">
                {o.lowStock.map((s) => (
                  <li key={s.key} className="flex items-center justify-between gap-3">
                    <span>{nameOf(s.key)}</span>
                    <Badge tone={s.qty === 0 ? "bad" : "warn"}>{s.qty === 0 ? "Out of stock" : `${s.qty} left`}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
