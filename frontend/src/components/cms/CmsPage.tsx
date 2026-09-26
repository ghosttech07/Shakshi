import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticles, getCatalog, getPage, getSite } from "@/lib/data";
import { jsonLd } from "@/lib/boot-script";
import { SITE_URL } from "@shakshi/shared/site";
import type { PageDoc } from "@shakshi/shared/cms/types";
import { RenderSections } from "./RenderSections";
import { plain } from "./text";

const needsArticles = (p: PageDoc) => p.sections.some((s) => !s.hidden && (s.type === "library-teaser" || s.type === "library-index"));
const path = (slug: string) => (slug ? `/${slug}` : "/");

/** Title, description, social image and robots for a CMS page, falling back to the site defaults. */
export async function pageMetadata(slug: string): Promise<Metadata> {
  const [page, site] = await Promise.all([getPage(slug), getSite()]);
  if (!page) return {};
  const title = page.seo.title || (slug ? page.title : "");
  const description = page.seo.description || site.seo.description;
  const image = page.seo.ogImage || site.seo.ogImage;
  return {
    ...(title ? { title: slug ? title : { absolute: title } } : {}),
    description,
    alternates: { canonical: path(slug) },
    openGraph: { title: title || site.seo.defaultTitle, description, url: path(slug), ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}) },
    ...(page.seo.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Structured data that follows from the sections on the page. */
async function structuredData(page: PageDoc, articles: Awaited<ReturnType<typeof getArticles>>) {
  const out: object[] = [];
  const visible = page.sections.filter((s) => !s.hidden);
  const faqs = visible.filter((s) => s.type === "faq").flatMap((s) => (Array.isArray(s.data.items) ? (s.data.items as { q: string; a: string }[]) : []));
  if (faqs.length) {
    out.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() } })),
    });
  }
  if (visible.some((s) => s.type === "shop-catalog")) {
    const products = await getCatalog();
    out.push({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/mattress/${p.slug}`, name: p.name })) });
  }
  if (visible.some((s) => s.type === "library-index")) {
    out.push({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "The Sleep Library",
      url: `${SITE_URL}${path(page.slug)}`,
      blogPost: articles.map((a) => ({ "@type": "BlogPosting", headline: a.title, url: `${SITE_URL}/sleep-library/${a.slug}`, datePublished: a.date, author: { "@type": "Person", name: a.author } })),
    });
  }
  return out;
}

export async function CmsPage({ slug }: { slug: string }) {
  const page = await getPage(slug);
  if (!page) notFound();
  const articles = needsArticles(page) ? await getArticles() : [];
  const ld = await structuredData(page, articles);
  const hasH1 = ["hero", "page-header", "thread-journey", "quiz", "sleep-studio-hero"].includes(page.sections.find((s) => !s.hidden)?.type ?? "");
  return (
    <>
      {ld.map((x, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(x) }} />
      ))}
      {!hasH1 && <h1 className="sr-only">{plain(page.seo.title || page.title)}</h1>}
      <RenderSections sections={page.sections} ctx={{ articles }} />
    </>
  );
}
