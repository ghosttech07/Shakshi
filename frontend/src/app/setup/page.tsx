import type { Metadata } from "next";
import Link from "next/link";
import { UnboxingFilm, ExpansionTimer } from "@/components/features/SetupGuide";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Bits";

export const metadata: Metadata = {
  title: "Setup Guide · Unboxing Your Mattress",
  description: "How to unbox and set up your Shakshi mattress, and how long it takes to fully expand.",
  alternates: { canonical: "/setup" },
};

const CARE = [
  ["The first week", "A faint, natural scent of wool and latex fades within a few days. Keep a window open when you can."],
  ["Turn with the seasons", "Rotate head-to-foot every three months in the first year, then twice a year."],
  ["White-glove customers", "If our team delivered and set up your mattress, it arrives already expanded. You can skip straight to sleep."],
];

export default function SetupPage() {
  return (
    <>
      <header className="container-lux pb-14 pt-36 lg:pb-20 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">Setup guide</p>
        </Reveal>
        <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text="Six calm steps to your first night." />
        </h1>
      </header>

      <section className="container-lux" aria-label="Unboxing film">
        <UnboxingFilm />
      </section>

      <section className="container-lux py-24 lg:py-32" aria-labelledby="expand-title">
        <SectionHeading eyebrow="The first 24 hours" title={<span id="expand-title">Your mattress is <em>expanding.</em></span>} className="mb-12" />
        <ExpansionTimer />
      </section>

      <section className="border-t border-ink/10 bg-ivory-2/50 linen" aria-label="Care notes">
        <div className="container-lux grid gap-10 py-20 md:grid-cols-3">
          {CARE.map(([t, b]) => (
            <Reveal key={t}>
              <h2 className="text-2xl">{t}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone">{b}</p>
            </Reveal>
          ))}
        </div>
        <p className="pb-16 text-center text-sm text-stone">
          Something not quite right?{" "}
          <Link href="/showroom?kind=video#book" className="link-lux text-ink">
            Book a free video call
          </Link>{" "}
          and we&rsquo;ll walk you through it.
        </p>
      </section>
    </>
  );
}
