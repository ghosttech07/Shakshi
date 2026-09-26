import type { Metadata } from "next";
import { getArticles } from "@/lib/data";
import { LibraryIndex } from "@/components/library/LibraryIndex";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { SITE_URL } from "@shakshi/shared/site";
import { jsonLd } from "@/lib/boot-script";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "The Sleep Library · Essays on Resting Well",
  description: "Essays from sleep physicians, physiotherapists and our own atelier: evening rituals, choosing firmness, back pain, sleeping cool and sleeping well together.",
  alternates: { canonical: "/sleep-library" },
};

export default async function SleepLibraryPage() {
  const articles = await getArticles();
  const ld = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "The Shakshi Sleep Library",
    url: `${SITE_URL}/sleep-library`,
    blogPost: articles.map((a) => ({ "@type": "BlogPosting", headline: a.title, url: `${SITE_URL}/sleep-library/${a.slug}`, datePublished: a.date, author: { "@type": "Person", name: a.author } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <header className="container-lux pb-14 pt-36 lg:pb-20 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">The Sleep Library</p>
        </Reveal>
        <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text="Slow reading, for deeper nights." />
        </h1>
        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-stone">Essays from sleep physicians, physiotherapists and our own atelier. Read one tonight, an hour before bed.</p>
        </Reveal>
        <div className="gold-rule mt-12" />
      </header>
      <LibraryIndex articles={articles} />
    </>
  );
}
