import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTICLES, getArticle, type Block } from "@/lib/articles";
import { getArticles, getCatalog } from "@/lib/server/catalog";
import { ArticleCard, ArticleMeta } from "@/components/library/LibraryIndex";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Img } from "@/components/ui/Img";
import { Reveal } from "@/components/ui/Reveal";
import { IconArrow, IconSparkle } from "@/components/ui/Icons";
import { SITE_URL } from "@/lib/site";
import { jsonLd } from "@/lib/boot-script";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getArticle(await getArticles(), (await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.dek,
    alternates: { canonical: `/sleep-library/${a.slug}` },
    openGraph: { type: "article", title: a.title, description: a.dek, publishedTime: a.date, authors: [a.author], images: [{ url: `${a.image}?w=1200&h=630&fit=crop&q=75`, width: 1200, height: 630, alt: a.imageAlt }] },
  };
}

function Body({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i} className={`mt-6 text-lg leading-[1.8] text-ink/85 ${i === 0 ? "first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-gold-ink" : ""}`}>
                {b.text}
              </p>
            );
          case "h2":
            return (
              <h2 key={i} className="mt-14 text-3xl sm:text-4xl">
                {b.text}
              </h2>
            );
          case "quote":
            return (
              <figure key={i} className="my-12 border-l border-gold pl-8">
                <blockquote className="font-serif text-3xl font-light italic leading-snug">&ldquo;{b.text}&rdquo;</blockquote>
                {b.cite && <figcaption className="eyebrow mt-4 text-stone">{b.cite}</figcaption>}
              </figure>
            );
          case "list":
            return (
              <ul key={i} className="mt-6 space-y-3">
                {b.items.map((it) => (
                  <li key={it} className="flex gap-4 text-lg leading-relaxed text-ink/85">
                    <span className="mt-3.5 h-px w-4 shrink-0 bg-gold" aria-hidden />
                    {it}
                  </li>
                ))}
              </ul>
            );
          case "tip":
            return (
              <aside key={i} className="my-10 bg-ivory-2 p-7 linen">
                <p className="flex items-center gap-2 eyebrow text-gold-ink">
                  <IconSparkle size={16} /> {b.title}
                </p>
                <p className="mt-3 leading-relaxed text-ink/85">{b.text}</p>
              </aside>
            );
        }
      })}
    </>
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [articles, products] = await Promise.all([getArticles(), getCatalog()]);
  const a = getArticle(articles, slug);
  if (!a) notFound();
  const related = (a.related ?? []).map((s) => products.find((p) => p.slug === s)).filter((p) => !!p).slice(0, 2);
  const more = articles.filter((x) => x.slug !== a.slug).slice(0, 3);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.dek,
    image: [`${a.image}?w=1600&q=80`],
    datePublished: a.date,
    author: { "@type": "Person", name: a.author },
    publisher: { "@type": "Organization", name: "Shakshi", logo: { "@type": "ImageObject", url: `${SITE_URL}/brand/shakshi-lockup-red.png` } },
    mainEntityOfPage: `${SITE_URL}/sleep-library/${a.slug}`,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <header className="container-lux pt-36 lg:pt-44">
        <div className="mx-auto max-w-3xl text-center">
          <Link href="/sleep-library" className="eyebrow text-gold-ink hover:text-ink">
            The Sleep Library · {a.category}
          </Link>
          <h1 className="display mt-6 text-5xl sm:text-6xl lg:text-7xl">{a.title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-stone">{a.dek}</p>
          <p className="mt-8 text-sm">{a.author}</p>
          <ArticleMeta a={a} />
        </div>
        <Img src={a.image} alt={a.imageAlt} sizes="100vw" preload quality={85} wrapperClassName="mt-14 aspect-[16/9] max-h-[70vh]" />
      </header>

      <div className="container-lux">
        <div className="mx-auto max-w-2xl py-16 lg:py-24">
          <Body blocks={a.body} />
          <div className="gold-rule mt-16" />
          <p className="mt-8 text-sm text-stone">
            Questions about your own sleep? Our specialists offer a complimentary 15-minute video consultation.{" "}
            <Link href="/showroom?kind=video#book" className="link-lux text-ink">
              Book a call
            </Link>
            .
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-ivory-2/60 py-20 linen" aria-labelledby="related-title">
          <div className="container-lux">
            <Reveal>
              <p className="eyebrow text-gold-ink">From the essay</p>
              <h2 id="related-title" className="display mt-4 text-4xl">
                Mattresses that suit this way of sleeping
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:w-2/3">
              {related.map((p, i) => (
                <ProductCard key={p!.slug} product={p!} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container-lux py-20 lg:py-28" aria-labelledby="more-title">
        <div className="flex items-end justify-between gap-6">
          <h2 id="more-title" className="display text-4xl">
            Keep reading
          </h2>
          <Link href="/sleep-library" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] hover:text-gold-ink">
            All essays <IconArrow size={14} />
          </Link>
        </div>
        <div className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {more.map((m, i) => (
            <ArticleCard key={m.slug} a={m} index={i} />
          ))}
        </div>
      </section>
    </article>
  );
}
