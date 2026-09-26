import type { Metadata } from "next";
import { IMG } from "@shakshi/shared/images";
import { Img } from "@/components/ui/Img";
import { Reveal, RevealText, Parallax } from "@/components/ui/Reveal";
import { HospitalityForm } from "@/components/features/HospitalityForm";
import { Certifications } from "@/components/commerce/Certifications";

export const metadata: Metadata = {
  title: "Hospitality & Trade · Bulk Mattress Orders",
  description: "Shakshi mattresses for hotels, serviced apartments, hostels and corporate buyers: trade pricing, custom sizes, fire-safe builds and a dedicated account manager.",
  alternates: { canonical: "/hospitality" },
};

const BENEFITS = [
  { title: "Trade pricing", body: "Tiered pricing from 20 beds, with transparent landed costs and no surprises at delivery." },
  { title: "Built for the property", body: "Custom sizes, zip-off washable covers, reinforced edges for daily turnover, and fire-safe builds for hotel compliance." },
  { title: "One person to call", body: "A dedicated account manager, sample rooms before you commit, and staggered deliveries around your occupancy." },
  { title: "Installed quietly", body: "Our crews work to your housekeeping schedule, set up every room, and take the old mattresses away for recycling." },
];

const STATS = [
  ["120+", "properties sleep on Shakshi"],
  ["18,000", "guest beds delivered"],
  ["7 yrs", "average mattress life in hotel use"],
];

export default function HospitalityPage() {
  return (
    <>
      <section data-dark-hero className="relative h-[80svh] min-h-[560px] overflow-hidden bg-midnight text-pearl" aria-labelledby="hosp-title">
        <Parallax amount={70} className="absolute inset-0">
          <Img src={IMG.resort} alt="" preload sizes="100vw" dark wrapperClassName="absolute inset-0" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/55 to-midnight/35" />
        <div className="container-lux relative flex h-full flex-col justify-end pb-16 lg:pb-24">
          <Reveal>
            <p className="eyebrow text-gold">Hospitality & trade</p>
          </Reveal>
          <h1 id="hosp-title" className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
            <RevealText text="Give every guest the best night of their trip." delay={0.2} />
          </h1>
        </div>
      </section>

      <section className="container-lux grid gap-14 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:py-32" aria-label="Why hotels choose Shakshi">
        <div>
          <Reveal>
            <p className="eyebrow text-gold-ink">For hotels, homes-away-from-home and offices</p>
            <p className="display mt-5 text-4xl lg:text-5xl">Guests remember the bed. So do reviews.</p>
            <p className="mt-6 leading-relaxed text-stone">From boutique villas to 300-key hotels, we build mattresses that feel like the best room in the house, and last through years of check-ins.</p>
          </Reveal>
          <dl className="mt-12 grid grid-cols-3 gap-6">
            {STATS.map(([n, l], i) => (
              <Reveal key={l} delay={i * 0.1} className="border-l border-gold/40 pl-4">
                <dt className="font-serif text-3xl sm:text-4xl">{n}</dt>
                <dd className="mt-1 text-xs text-stone">{l}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
        <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <Reveal as="li" key={b.title} delay={i * 0.08}>
              <p className="font-serif text-lg text-gold-ink">0{i + 1}</p>
              <h2 className="mt-2 text-3xl">{b.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone">{b.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="border-y border-ink/10 bg-ivory-2/50 py-14 linen" aria-label="Certifications">
        <div className="container-lux">
          <Certifications />
        </div>
      </section>

      <section id="enquire" className="container-lux grid scroll-mt-24 gap-14 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32" aria-labelledby="enquire-title">
        <div>
          <Reveal>
            <p className="eyebrow text-gold-ink">Enquire</p>
            <h2 id="enquire-title" className="display mt-4 text-4xl lg:text-5xl">
              Tell us about your property.
            </h2>
            <p className="mt-5 text-stone">We&rsquo;ll reply within a working day with pricing, lead times and an offer to send a sample room.</p>
          </Reveal>
          <Reveal delay={0.2} className="mt-10 hidden lg:block">
            <Img src={IMG.hotel} alt="A calm, well-made hotel bedroom" sizes="30vw" wrapperClassName="aspect-[4/5] max-w-sm" />
          </Reveal>
        </div>
        <HospitalityForm />
      </section>
    </>
  );
}
