import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { Anatomy } from "@/components/home/Anatomy";
import { FeaturedCollection, WhyStrip, Editorial, PressBand, ToolsTeaser, SleepSociety } from "@/components/home/Sections";
import { Testimonials } from "@/components/home/Testimonials";
import { FirmnessSimulator } from "@/components/features/FirmnessSimulator";
import { SectionHeading } from "@/components/ui/Bits";
import { Reveal } from "@/components/ui/Reveal";
import { IconArrow } from "@/components/ui/Icons";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedCollection />
      <Anatomy />
      <WhyStrip />
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
      <ToolsTeaser />
      <SleepSociety />
    </>
  );
}
