import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { liveOrders, orders } from "@/lib/server/studio-data";
import { Empty, Filters, PageHead, TableWrap, inr, when } from "@/components/studio/ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const base = await requireStudio();
  const { q = "" } = await searchParams;
  const os = await orders();

  type C = { email: string; name: string; phone: string; city: string; orders: number; spent: number; last: string };
  const people = new Map<string, C>();
  for (const o of liveOrders(os)) {
    const e = o.data.customer?.email?.toLowerCase();
    if (!e) continue;
    const c = people.get(e) ?? { email: e, name: `${o.data.customer.first} ${o.data.customer.last}`, phone: o.data.customer.phone, city: o.data.customer.city, orders: 0, spent: 0, last: o.created_at };
    c.orders += 1;
    c.spent += o.data.total;
    if (o.created_at > c.last) c.last = o.created_at;
    people.set(e, c);
  }
  const needle = q.trim().toLowerCase();
  const rows = [...people.values()].filter((c) => !needle || [c.email, c.name, c.phone, c.city].some((v) => v.toLowerCase().includes(needle))).sort((a, b) => b.last.localeCompare(a.last));

  return (
    <>
      <PageHead eyebrow="Customers" title="Customers" intro="Everyone who has ordered. Click a name to see their orders and messages." />
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
                  <td className="whitespace-nowrap text-stone">{when(c.last, false)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <Empty title="No customers yet." />
      )}

    </>
  );
}
