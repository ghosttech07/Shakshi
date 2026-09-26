import type { Metadata } from "next";
import { ShopClient } from "@/components/shop/ShopClient";
import { RevealText, Reveal } from "@/components/ui/Reveal";
import { PRODUCTS } from "@shakshi/shared/products";
import { SITE_URL } from "@shakshi/shared/site";

export const metadata: Metadata = {
  title: "The Collection",
  description: "Five handcrafted luxury mattresses, from cloud-soft to sculpted and firm. Filter by firmness, size, material and sleeping position.",
  alternates: { canonical: "/shop" },
};

const listJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: PRODUCTS.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/mattress/${p.slug}`, name: p.name })),
};

export default function ShopPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }} />
      <header className="container-lux pb-10 pt-36 lg:pb-16 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">The Collection</p>
        </Reveal>
        <h1 className="display mt-5 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text="Find the one you'll never want to leave." />
        </h1>
        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-stone">Every mattress is handcrafted to order, delivered by our white-glove team, and yours to try for 100 nights.</p>
        </Reveal>
        <div className="gold-rule mt-12" />
      </header>
      <ShopClient />
    </>
  );
}
