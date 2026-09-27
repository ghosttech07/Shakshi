import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import { orders, stageOf } from "@/lib/server/studio-data";
import { getCatalog } from "@/lib/server/catalog";
import { STAGES } from "@shakshi/shared/orders";
import type { BookingData, LeadData, ReviewData } from "@shakshi/shared/records";
import { Badge, Empty, PageHead, inr, when } from "@/components/studio/ui";

export const metadata = { title: "Customer" };

type Quiz = { answers: Record<string, string>; match: string; score: number };

export default async function CustomerPage({ params }: { params: Promise<{ email: string }> }) {
  const base = await requireStudio();
  const email = decodeURIComponent((await params).email).toLowerCase();
  const [os, quiz, bookings, leads, reviews, catalog] = await Promise.all([
    orders(),
    list<Quiz>("quiz_results", { email, limit: 100 }),
    list<BookingData>("bookings", { email, limit: 100 }),
    list<LeadData>("leads", { email, limit: 100 }),
    list<ReviewData>("reviews", { email, limit: 100 }),
    getCatalog({ includeUnpublished: true }),
  ]);
  const mine = os.filter((o) => o.data.customer?.email?.toLowerCase() === email);
  const c = mine[0]?.data.customer;
  const spent = mine.filter((o) => !o.data.sample).reduce((s, o) => s + o.data.total, 0);
  const name = (slug: string) => catalog.find((p) => p.slug === slug)?.name ?? slug;

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href={`${base}/customers`} className="text-stone hover:text-ink">
          ← Customers
        </Link>
      </p>
      <PageHead eyebrow={email} title={c ? `${c.first} ${c.last}` : email} intro={c ? `${c.city} · ${c.phone} · ${mine.length} order${mine.length === 1 ? "" : "s"}, ${inr(spent)} in total` : undefined} />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="text-2xl">Orders</h2>
          {mine.length ? (
            <ul className="mt-3 divide-y divide-ink/[0.06]">
              {mine.map((o) => (
                <li key={o.id}>
                  <Link href={`${base}/orders/${encodeURIComponent(o.id)}`} className="flex flex-wrap justify-between gap-2 py-3 hover:text-gold-ink">
                    <span>
                      <span className="font-semibold">{o.id}</span> <span className="text-xs text-stone">{when(o.created_at, false)}</span>
                      <span className="block text-xs text-stone">{o.data.items.map((i) => i.name).join(", ")}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <Badge tone="gold">{STAGES.find((s) => s.id === stageOf(o))?.admin}</Badge>
                      {inr(o.data.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-stone">No orders yet.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-2xl">Sleep Quiz</h2>
          {quiz.length ? (
            <ul className="mt-3 space-y-3">
              {quiz.map((r) => (
                <li key={r.id}>
                  <p>
                    Matched <strong>{name(r.data.match)}</strong> ({r.data.score}%) <span className="text-xs text-stone">{when(r.created_at, false)}</span>
                  </p>
                  <p className="text-xs text-stone">
                    {Object.entries(r.data.answers ?? {})
                      .filter(([, v]) => v)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-stone">No quiz results linked to this email.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-2xl">Bookings</h2>
          {bookings.length ? (
            <ul className="mt-3 space-y-2">
              {bookings.map((b) => (
                <li key={b.id} className="flex justify-between gap-3">
                  <span>{b.data.kind === "salon" ? "Salon visit" : b.data.kind === "home" ? "Home trial" : "Video call"} · {when(b.data.start)}</span>
                  <Badge>{b.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-stone">None.</p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-2xl">Messages & reviews</h2>
          {leads.length + reviews.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {leads.map((l) => (
                <li key={l.id}>
                  <Badge>{l.data.kind}</Badge> <span className="text-stone">{when(l.created_at, false)}</span>
                </li>
              ))}
              {reviews.map((r) => (
                <li key={r.id}>
                  Review of {name(r.data.product)}: “{r.data.title}” <Badge>{r.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <Empty title="Nothing yet." />
          )}
        </section>
      </div>
    </>
  );
}
