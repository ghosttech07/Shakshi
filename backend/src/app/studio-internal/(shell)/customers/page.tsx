import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { liveOrders, orders } from "@/lib/server/studio-data";
import { list } from "@/lib/server/db";
import type { AccountProfile } from "@shakshi/shared/account";
import { Empty, Filters, PageHead, TableWrap, inr, when } from "@/components/studio/ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const base = await requireStudio();
  const { q = "" } = await searchParams;
  const [os, accounts] = await Promise.all([orders(), list<AccountProfile>("customers", { limit: 5000 })]);

  type C = { email: string; name: string; phone: string; city: string; orders: number; spent: number; last: string; account: boolean };
  const people = new Map<string, C>();
  // Everyone with an account, including those who haven't ordered yet
  for (const a of accounts) {
    const e = a.id.toLowerCase();
    people.set(e, { email: e, name: a.data.name ?? "", phone: a.data.phone ?? "", city: "", orders: 0, spent: 0, last: a.data.lastSignInAt ?? a.created_at, account: true });
  }
  for (const o of liveOrders(os)) {
    const e = o.data.customer?.email?.toLowerCase();
    if (!e) continue;
    const c = people.get(e) ?? { email: e, name: "", phone: "", city: "", orders: 0, spent: 0, last: o.created_at, account: false };
    c.name ||= `${o.data.customer.first} ${o.data.customer.last}`;
    c.phone ||= o.data.customer.phone;
    c.city ||= o.data.customer.city;
    c.orders += 1;
    c.spent += o.data.total;
    if (o.created_at > c.last) c.last = o.created_at;
    people.set(e, c);
  }
  const needle = q.trim().toLowerCase();
  const rows = [...people.values()].filter((c) => !needle || [c.email, c.name, c.phone, c.city].some((v) => v.toLowerCase().includes(needle))).sort((a, b) => b.last.localeCompare(a.last));

  return (
    <>
      <PageHead eyebrow="Customers" title="Customers" intro="Everyone with an account or an order. Click a name to see their orders and messages." />
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
                <th>Account</th>
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
                  <td className="text-stone">{c.account ? "Signed up" : "Guest"}</td>
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
