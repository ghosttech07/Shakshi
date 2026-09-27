import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ACCESSORY_RANGES } from "@shakshi/shared/products";
import { SITE_URL } from "@shakshi/shared/site";
import { getStorefront } from "@/lib/data";
import { jsonLd } from "@/lib/boot-script";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { RangeTabs } from "@/components/shop/RangeTabs";
import { AccessoryGrid } from "@/components/shop/AccessoryGrid";

// The Pillows and Mattress Covers pages (/shop/pillows, /shop/covers). Items are edited in the studio.
export const revalidate = 300;
export const dynamicParams = false;

type Props = { params: Promise<{ category: string }> };

export const generateStaticParams = () => ACCESSORY_RANGES.map((r) => ({ category: r.slug }));

const rangeFor = async (props: Props) => {
  const { category } = await props.params;
  return ACCESSORY_RANGES.find((r) => r.slug === category);
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const r = await rangeFor(props);
  if (!r) notFound();
  return { title: r.label, description: r.intro, alternates: { canonical: `/shop/${r.slug}` } };
}

export default async function RangePage(props: Props) {
  const r = await rangeFor(props);
  if (!r) notFound();
  const items = (await getStorefront()).accessories.filter((a) => a.kind === r.kind);
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: r.label,
    itemListElement: items.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: { "@type": "Product", name: a.name, image: a.image, description: a.description || a.note, url: `${SITE_URL}/shop/${r.slug}#${a.id}`, offers: { "@type": "Offer", priceCurrency: "INR", price: a.price, availability: "https://schema.org/InStock" } },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <header className="container-lux pb-10 pt-36 lg:pb-14 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">Products</p>
        </Reveal>
        <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text={r.label} />
        </h1>
        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-stone">{r.intro}</p>
        </Reveal>
        <div className="gold-rule mt-12" />
      </header>
      <div className="container-lux pb-32">
        <RangeTabs current={r.slug} />
        <AccessoryGrid kind={r.kind} />
      </div>
    </>
  );
}
