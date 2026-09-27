import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import { liveOrders, orders } from "@/lib/server/studio-data";
import { getCatalog } from "@/lib/server/catalog";
import { Empty, Filters, PageHead, TableWrap, inr, when } from "@/components/studio/ui";
import { StatusSelect } from "@/components/studio/actions";

export const metadata = { title: "Customers" };

type Quiz = { answers: Record<string, string>; match: string; score: number };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const base = await requireStudio();
  const { q = "" } = await searchParams;
  const [os, quiz, catalog] = await Promise.all([orders(), list<Quiz>("quiz_results", { limit: 2000 }), getCatalog({ includeUnpublished: true })]);

  type C = { email: string; name: string; phone: string; city: string; orders: number; spent: number; last: string; quiz: number };
  const people = new Map<string, C>();
  for (const o of liveOrders(os)) {
    const e = o.data.customer?.email?.toLowerCase();
    if (!e) continue;
    const c = people.get(e) ?? { email: e, name: `${o.data.customer.first} ${o.data.customer.last}`, phone: o.data.customer.phone, city: o.data.customer.city, orders: 0, spent: 0, last: o.created_at, quiz: 0 };
    c.orders += 1;
    c.spent += o.data.total;
    if (o.created_at > c.last) c.last = o.created_at;
    people.set(e, c);
  }
  for (const r of quiz) {
    if (!r.email) continue;
    const c = people.get(r.email) ?? { email: r.email, name: "", phone: "", city: "", orders: 0, spent: 0, last: r.created_at, quiz: 0 };
    c.quiz += 1;
    people.set(r.email, c);
  }
  const needle = q.trim().toLowerCase();
  const rows = [...people.values()].filter((c) => !needle || [c.email, c.name, c.phone, c.city].some((v) => v.toLowerCase().includes(needle))).sort((a, b) => b.last.localeCompare(a.last));
  const anonymous = quiz.filter((r) => !r.email).slice(0, 50);
  const productName = (slug: string) => catalog.find((p) => p.slug === slug)?.name ?? slug;

  return (
    <>
      <PageHead eyebrow="People" title="Customers" intro="Everyone who has ordered, or taken the Sleep Quiz while signed in." />
      <Filters>
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="label">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} className="field" placeholder="Name, email, phone or city" />
        </div>
        <button className="btn btn-dark">Search</button>
      </Filters>
      {rows.length ? (
        <TableWrap>
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Customer</th>
                <th>City</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Quiz</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.email}>
                  <td>
                    <Link href={`${base}/customers/${encodeURIComponent(c.email)}`} className="font-semibold text-gold-ink hover:underline">
                      {c.name || c.email}
                    </Link>
                    {c.name && <span className="block text-xs text-stone">{c.email}</span>}
                  </td>
                  <td className="text-stone">{c.city || "—"}</td>
                  <td>{c.orders}</td>
                  <td className="tabular-nums">{inr(c.spent)}</td>
                  <td>{c.quiz ? `${c.quiz} result${c.quiz > 1 ? "s" : ""}` : "—"}</td>
                  <td className="whitespace-nowrap text-stone">{when(c.last, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <Empty title="No customers yet." />
      )}

      <h2 className="mb-1 mt-10 text-2xl">Recent quiz results</h2>
      <p className="mb-3 text-sm text-stone">From visitors who weren&rsquo;t signed in. Useful for learning what sleepers need.</p>
      {anonymous.length ? (
        <TableWrap>
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>When</th>
                <th>Matched</th>
                <th>Answers</th>
                <th>Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {anonymous.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-stone">{when(r.created_at)}</td>
                  <td>
                    {productName(r.data.match)} <span className="text-xs text-stone">{r.data.score}%</span>
                  </td>
                  <td className="text-xs text-stone">{Object.values(r.data.answers ?? {}).filter(Boolean).join(" · ")}</td>
                  <td>
                    <StatusSelect url={`/api/admin/records/quiz_results/${r.id}`} value={r.status ?? "new"} options={[{ value: "new", label: "New" }, { value: "contacted", label: "Contacted" }]} label="Follow-up" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <Empty title="No quiz results yet." />
      )}
    </>
  );
}
