import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { orders, stageOf } from "@/lib/server/studio-data";
import { STAGES } from "@shakshi/shared/orders";
import { Badge, Empty, Filters, PageHead, TableWrap, inr, when } from "@/components/studio/ui";

export const metadata = { title: "Orders" };

type Props = { searchParams: Promise<{ q?: string; stage?: string; show?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  const base = await requireStudio();
  const { q = "", stage = "", show = "" } = await searchParams;
  const all = await orders();
  const needle = q.trim().toLowerCase();
  const rows = all
    .filter((o) => show === "samples" || !o.data.sample)
    .filter((o) => !stage || (stage === "open" ? stageOf(o) !== "delivered" : stageOf(o) === stage))
    .filter((o) => {
      if (!needle) return true;
      const c = o.data.customer ?? {};
      return [o.id, c.first, c.last, c.email, c.phone, c.city, c.pincode].some((v) => String(v ?? "").toLowerCase().includes(needle));
    });

  return (
    <>
      <PageHead eyebrow="Sales" title="Orders" intro={`${rows.length} of ${all.length} orders`} />
      <Filters>
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="label">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} className="field" placeholder="Order number, name, email, phone, city" />
        </div>
        <div>
          <label htmlFor="stage" className="label">
            Status
          </label>
          <select id="stage" name="stage" defaultValue={stage} className="field">
            <option value="">All</option>
            <option value="open">Not yet delivered</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.admin}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="show" value="samples" defaultChecked={show === "samples"} /> Include sample orders
        </label>
        <button className="btn btn-dark">Apply</button>
      </Filters>

      {rows.length ? (
        <TableWrap>
          <table className="table min-w-[860px]">
            <thead>
              <tr>
                <th>Order</th>
                <th>Placed</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const s = stageOf(o);
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`${base}/orders/${encodeURIComponent(o.id)}`} className="font-semibold text-gold-ink hover:underline">
                        {o.id}
                      </Link>
                      {o.data.sample && <span className="ml-2 text-xs text-stone">sample</span>}
                    </td>
                    <td className="whitespace-nowrap text-stone">{when(o.created_at)}</td>
                    <td>
                      {o.data.customer?.first} {o.data.customer?.last}
                      <span className="block text-xs text-stone">{o.data.customer?.city}</span>
                    </td>
                    <td className="text-stone">{o.data.items?.reduce((n, i) => n + i.qty, 0)}</td>
                    <td className="tabular-nums">{inr(o.data.total)}</td>
                    <td className="text-stone">{o.data.payment || "—"}</td>
                    <td>
                      <Badge tone={s === "delivered" ? "ok" : s === "placed" ? "neutral" : "gold"}>{STAGES.find((x) => x.id === s)?.admin}</Badge>
                      {o.data.statusMode === "manual" && <span className="ml-1 text-[0.65rem] text-stone">set by hand</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <Empty title="No orders match.">{all.length ? "Try a different search or status." : "Orders appear here as soon as they're placed."}</Empty>
      )}
    </>
  );
}
