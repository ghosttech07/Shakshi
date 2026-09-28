import { requireStudio } from "@/lib/server/studio";
import { list } from "@/lib/server/db";
import type { DiscountData } from "@shakshi/shared/records";
import { Badge, Empty, PageHead, TableWrap, inr, when } from "@/components/studio/ui";
import { ActionButton } from "@/components/studio/actions";
import { DiscountForm } from "@/components/studio/DiscountForm";

export const metadata = { title: "Discount codes" };

export default async function DiscountsPage() {
  await requireStudio();
  const rows = await list<DiscountData>("discount_codes", { limit: 500 });
  const state = (d: DiscountData) =>
    !d.active ? ["Paused", "neutral"] : d.expiresAt && new Date(d.expiresAt) < new Date() ? ["Expired", "neutral"] : d.usageLimit && d.uses >= d.usageLimit ? ["Used up", "neutral"] : ["Active", "ok"];

  return (
    <>
      <PageHead eyebrow="Sales" title="Discount codes" intro="Create a code, and customers can type it at checkout to get money off." />
      <DiscountForm />
      <div className="mt-8">
        {rows.length ? (
          <TableWrap>
            <table className="table min-w-[760px]">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Used</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const d = r.data;
                  const [label, tone] = state(d);
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className="font-mono font-semibold">{r.id}</span>
                        {d.note && <span className="block text-xs text-stone">{d.note}</span>}
                      </td>
                      <td>
                        {d.type === "percent" ? `${d.value}% off` : `${inr(d.value)} off`}
                        {d.minSubtotal && <span className="block text-xs text-stone">orders over {inr(d.minSubtotal)}</span>}
                      </td>
                      <td>
                        {d.uses}
                        {d.usageLimit ? ` of ${d.usageLimit}` : ""}
                      </td>
                      <td className="text-stone">{d.expiresAt ? when(d.expiresAt, false) : "Never"}</td>
                      <td>
                        <Badge tone={tone as "ok" | "neutral"}>{label}</Badge>
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <span className="inline-flex gap-2">
                          <ActionButton url={`/api/admin/discounts/${encodeURIComponent(r.id)}`} body={{ active: !d.active }}>
                            {d.active ? "Pause" : "Resume"}
                          </ActionButton>
                          <ActionButton url={`/api/admin/discounts/${encodeURIComponent(r.id)}`} method="DELETE" confirm={`Delete ${r.id}? Customers will no longer be able to use it.`} className="btn btn-danger btn-sm">
                            Delete
                          </ActionButton>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <Empty title="No discount codes yet." />
        )}
      </div>
    </>
  );
}
