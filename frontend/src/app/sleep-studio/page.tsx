import type { Metadata } from "next";
import { FirmnessSimulator } from "@/components/features/FirmnessSimulator";
import { SleepCalculator } from "@/components/features/SleepCalculator";
import { SwatchRequest } from "@/components/features/SwatchRequest";
import { SectionHeading } from "@/components/ui/Bits";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { Img } from "@/components/ui/Img";
import { IMG } from "@shakshi/shared/images";

export const metadata: Metadata = {
  title: "The Sleep Studio",
  description: "Feel each Shakshi mattress yield with our firmness simulator, calculate bedtimes by 90-minute sleep cycles, and order free fabric swatches.",
  alternates: { canonical: "/sleep-studio" },
};

export default function SleepStudioPage() {
  return (
    <>
      <section data-dark-hero className="relative overflow-hidden bg-midnight pb-24 pt-36 text-pearl linen-dark lg:pb-32 lg:pt-44" aria-labelledby="studio-title">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_50%_at_75%_20%,rgb(201_169_110/0.12),transparent)]" />
        <div className="container-lux relative grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <Reveal>
              <p className="eyebrow text-gold">The Sleep Studio</p>
            </Reveal>
            <h1 id="studio-title" className="display mt-5 text-5xl sm:text-6xl lg:text-7xl">
              <RevealText text="Feel it before it arrives." />
            </h1>
            <Reveal delay={0.3}>
              <p className="mt-6 max-w-md leading-relaxed text-pearl/65">
                Press and hold the mattress. Watch the layers yield beneath your hand, then notice how each one returns: slowly and tenderly, or with a buoyant lift.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <FirmnessSimulator dark />
          </Reveal>
        </div>
      </section>

      <section id="calculator" className="container-lux grid scroll-mt-24 gap-14 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32" aria-labelledby="calc-title">
        <div>
          <SectionHeading eyebrow="Sleep calculator" title={<span id="calc-title">Wake between <em>dreams.</em></span>} intro="Sleep moves in gentle 90-minute cycles. Waking at the end of one, rather than in the middle, is the difference between groggy and restored." />
          <Reveal delay={0.2} className="mt-10 hidden lg:block">
            <Img src={IMG.moon} alt="The full moon against a dark sky" sizes="30vw" dark wrapperClassName="aspect-square max-w-sm" />
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <SleepCalculator />
        </Reveal>
      </section>

      <section id="swatches" className="scroll-mt-24 border-t border-ink/10 bg-ivory-2/50 linen" aria-labelledby="swatch-title">
        <div className="container-lux grid gap-14 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32">
          <div>
            <SectionHeading eyebrow="Complimentary" title={<span id="swatch-title">Touch the <em>fabric</em> first.</span>} intro="We'll post you up to three swatches of our covers, so you can feel the weave and see the colour in your own light. Always free." />
            <Reveal delay={0.2} className="mt-10 hidden lg:block">
              <Img src={IMG.linen} alt="Natural linen weave in soft light" sizes="30vw" wrapperClassName="aspect-[4/3] max-w-sm" />
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <SwatchRequest />
          </Reveal>
        </div>
      </section>
    </>
  );
}
