import Link from "next/link";
import { requireStudio } from "@/lib/server/studio";
import { getCatalog, getStock, stockKey } from "@/lib/server/catalog";
import { SIZES, priceFor } from "@shakshi/shared/products";
import { Badge, PageHead, TableWrap, inr } from "@/components/studio/ui";
import { NewProductForm } from "@/components/studio/NewProductForm";
import { ActionButton } from "@/components/studio/actions";

export const metadata = { title: "Mattresses" };

export default async function ProductsPage() {
  const base = await requireStudio();
  const [products, stock] = await Promise.all([getCatalog({ includeUnpublished: true }), getStock()]);
  return (
    <>
      <PageHead eyebrow="Catalogue" title="Mattresses" intro="Click a mattress to change its photos, prices, stock or description." actions={<NewProductForm base={base} />} />
      <TableWrap>
        <table className="table min-w-[980px]">
          <thead>
            <tr>
              <th>Mattress</th>
              <th>Firmness</th>
              <th>Prices</th>
              {SIZES.map((s) => (
                <th key={s.id}>{s.label}</th>
              ))}
              <th>Shown</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.slug}>
                <td>
                  <Link href={`${base}/products/${p.slug}`} className="flex items-center gap-3">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0].includes("unsplash.com") ? `${p.images[0]}?w=120&q=60` : p.images[0]} alt="" className="h-10 w-14 rounded object-cover" />
                    )}
                    <span className="font-semibold text-gold-ink hover:underline">{p.name}</span>
                  </Link>
                </td>
                <td>
                  {p.firmness}/10 <span className="text-xs text-stone">{p.firmnessLabel}</span>
                </td>
                <td className="whitespace-nowrap tabular-nums">
                  {inr(priceFor(p, "single"))} – {inr(priceFor(p, "superking"))}
                </td>
                {SIZES.map((s) => {
                  const q = stock[stockKey(p.slug, s.id)];
                  return <td key={s.id}>{typeof q === "number" ? <Badge tone={q === 0 ? "bad" : q <= 3 ? "warn" : "neutral"}>{q}</Badge> : <span className="text-xs text-stone">to order</span>}</td>;
                })}
                <td>{p.published === false ? <Badge>Hidden</Badge> : <Badge tone="ok">Shown</Badge>}</td>
                <td className="text-right">
                  <ActionButton
                    url={`/api/admin/products/${encodeURIComponent(p.slug)}`}
                    method="DELETE"
                    confirm={`Delete ${p.name}? It will be removed from the website straight away. Past orders are not affected.`}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
