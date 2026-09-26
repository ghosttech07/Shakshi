import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { REVIEWS, priceFor } from "@shakshi/shared/products";
import { getApprovedReviews, getCatalog } from "@/lib/data";
import { jsonLd } from "@/lib/boot-script";
import { ProductDetail } from "@/components/product/ProductDetail";
import { SITE_URL } from "@shakshi/shared/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getCatalog()).map((p) => ({ slug: p.slug }));
}

// Mattresses created in the studio render on first visit, then refresh every few minutes.
export const dynamicParams = true;
export const revalidate = 300;

const find = async (slug: string) => (await getCatalog()).find((p) => p.slug === slug);


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await find((await params).slug);
  if (!p) return {};
  return {
    title: `${p.name} · ${p.firmnessLabel} Mattress`,
    description: `${p.tagline} ${p.description}`,
    alternates: { canonical: `/mattress/${p.slug}` },
    openGraph: { title: `${p.name} · Shakshi`, description: p.tagline, images: [{ url: `${p.images[0]}?w=1200&h=630&fit=crop&q=75`, width: 1200, height: 630, alt: p.name }] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await find(slug);
  if (!product) notFound();
  const extraReviews = await getApprovedReviews(slug);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => `${i}?w=1600&q=80`),
    sku: `SHK-${product.slug.toUpperCase()}`,
    brand: { "@type": "Brand", name: "Shakshi" },
    material: product.layers.map((l) => l.material).join(", "),
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    review: REVIEWS.slice(0, 3).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.date,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      name: r.title,
      reviewBody: r.body,
    })),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: priceFor(product, "single"),
      highPrice: priceFor(product, "superking"),
      offerCount: 5,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/mattress/${product.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <ProductDetail product={product} extraReviews={extraReviews} />
    </>
  );
}
