import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudio } from "@/lib/server/studio";
import { getCatalog, getStock, stockKey } from "@/lib/server/catalog";
import { editorContext } from "@/lib/server/studio-data";
import { PRODUCTS, SIZES } from "@shakshi/shared/products";
import { PageHead } from "@/components/studio/ui";
import { ProductEditor } from "@/components/studio/ProductEditor";

export const metadata = { title: "Edit mattress" };

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const base = await requireStudio();
  const slug = decodeURIComponent((await params).slug);
  const [products, stock, ctx] = await Promise.all([getCatalog({ includeUnpublished: true }), getStock(), editorContext()]);
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const sizes = Object.fromEntries(SIZES.map((s) => [s.id, stock[stockKey(slug, s.id)] ?? null]));
  return (
    <>
      <p className="mb-3 text-sm">
        <Link href={`${base}/products`} className="text-stone hover:text-ink">
          ← Mattresses
        </Link>
      </p>
      <PageHead eyebrow={`/mattress/${p.slug}`} title={p.name} />
      <ProductEditor product={p} stock={sizes} ctx={ctx} base={base} frontend={process.env.FRONTEND_URL ?? "http://localhost:3000"} builtIn={PRODUCTS.some((x) => x.slug === slug)} />
    </>
  );
}
