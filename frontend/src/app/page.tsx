import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { Anatomy } from "@/components/home/Anatomy";
import { FeaturedCollection, WhyStrip, Editorial, PressBand, ToolsTeaser, SleepSociety } from "@/components/home/Sections";
import { Testimonials } from "@/components/home/Testimonials";
import { FirmnessSimulator } from "@/components/features/FirmnessSimulator";
import { SectionHeading } from "@/components/ui/Bits";
import { Reveal } from "@/components/ui/Reveal";
import { IconArrow } from "@/components/ui/Icons";
import { RecommendedRow } from "@/components/commerce/RecommendedRow";
import { BrandComparison } from "@/components/home/BrandComparison";
import { Certifications } from "@/components/commerce/Certifications";
import { RealBedrooms } from "@/components/library/RealBedrooms";
import { ArticleCard } from "@/components/library/LibraryIndex";
import { getArticles } from "@/lib/data";

export default async function Home() {
  const articles = (await getArticles()).slice(0, 3);
  return (
    <>
      <Hero />
      <FeaturedCollection />
      <RecommendedRow className="pt-0 lg:pt-0" />
      <Anatomy />
      <WhyStrip />
      <BrandComparison />
      <section className="border-y border-ink/10 py-12" aria-label="Certifications">
        <div className="container-lux flex flex-col items-center gap-6 text-center">
          <p className="eyebrow text-stone">Certified, thread by thread</p>
          <Certifications className="justify-center" />
        </div>
      </section>
      <section className="container-lux grid gap-14 py-24 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:py-36" aria-labelledby="feel-title">
        <div>
          <SectionHeading eyebrow="Feel it from here" title={<span id="feel-title">Press gently. <em>Sink slowly.</em></span>} intro="Every Shakshi yields differently. Press and hold the mattress to feel how deeply each one welcomes you, and how it rises to meet you again." />
          <Reveal delay={0.2}>
            <Link href="/sleep-studio" className="mt-10 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] hover:text-gold-ink">
              Visit the Sleep Studio <IconArrow size={16} />
            </Link>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <FirmnessSimulator />
        </Reveal>
      </section>
      <Editorial />
      <Testimonials />
      <PressBand />
      <section className="container-lux py-24 lg:py-32" aria-labelledby="bedrooms-title">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="Real bedrooms" title={<span id="bedrooms-title">Where our mattresses <em>live now.</em></span>} />
          <Link href="/real-bedrooms" className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] hover:text-gold-ink">
            See every room <IconArrow size={16} />
          </Link>
        </div>
        <RealBedrooms limit={3} />
      </section>
      <ToolsTeaser />
      <section className="container-lux pb-24 lg:pb-32" aria-labelledby="library-title">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <SectionHeading eyebrow="The Sleep Library" title={<span id="library-title">Read one tonight, <em>an hour before bed.</em></span>} />
          <Link href="/sleep-library" className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] hover:text-gold-ink">
            All essays <IconArrow size={16} />
          </Link>
        </div>
        <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a, i) => (
            <ArticleCard key={a.slug} a={a} index={i} />
          ))}
        </div>
      </section>
      <SleepSociety />
    </>
  );
}
