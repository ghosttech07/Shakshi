import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, getSite } from "@/lib/data";
import { ShopClient } from "@/components/shop/ShopClient";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { jsonLd } from "@/lib/boot-script";
import { SITE_URL } from "@shakshi/shared/site";

// One page per product category (Site & theme → Product categories in the studio).
export const revalidate = 300;
export const dynamicParams = true;

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return (await getSite()).categories.filter((c) => c.slug).map((c) => ({ category: c.slug }));
}

async function find(slug: string) {
  return (await getSite()).categories.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await find((await params).category);
  if (!c) notFound();
  return { title: c.name, description: c.description, alternates: { canonical: `/shop/${c.slug}` } };
}

export default async function CategoryPage({ params }: Props) {
  const c = await find((await params).category);
  if (!c) notFound();
  const products = (await getCatalog()).filter((p) => p.category === c.slug);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.name,
    itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/mattress/${p.slug}`, name: p.name })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <header className="container-lux pb-10 pt-36 lg:pb-14 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">Products</p>
        </Reveal>
        <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text={c.name} />
        </h1>
        {c.description && (
          <Reveal delay={0.3}>
            <p className="mt-6 max-w-xl text-stone">{c.description}</p>
          </Reveal>
        )}
        <div className="gold-rule mt-12" />
      </header>
      <ShopClient category={c.slug} />
    </>
  );
}
