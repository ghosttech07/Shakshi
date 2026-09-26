import type { Metadata } from "next";
import { RealBedrooms } from "@/components/library/RealBedrooms";
import { Reveal, RevealText } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Real Bedrooms · Shop Our Sleepers' Rooms",
  description: "Photographs from Shakshi sleepers across India, each tagged with the mattress and bedding in the room.",
  alternates: { canonical: "/real-bedrooms" },
};

export default function RealBedroomsPage() {
  return (
    <>
      <header className="container-lux pb-12 pt-36 lg:pb-16 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">Real bedrooms</p>
        </Reveal>
        <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text="Where our mattresses live now." />
        </h1>
        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-stone">Rooms from sleepers across India. Tap a photograph to see, and shop, exactly what&rsquo;s in it.</p>
        </Reveal>
      </header>
      <section className="container-lux pb-28" aria-label="Customer bedrooms">
        <RealBedrooms />
      </section>
    </>
  );
}
