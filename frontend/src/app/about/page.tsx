import type { Metadata } from "next";
import Link from "next/link";
import { IMG } from "@shakshi/shared/images";
import { Img } from "@/components/ui/Img";
import { Reveal, RevealText, Parallax } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";
import { IconArrow } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Craftsmanship · Our Story",
  description: "How Shakshi mattresses are made: a workshop outside Bengaluru, hand-tufted wool, organic latex from Kerala, and a patient, sustainable way of working.",
  alternates: { canonical: "/about" },
};

const CHAPTERS = [
  {
    n: "01",
    eyebrow: "The origin",
    title: "It began with a sleepless night.",
    body: [
      "In 2014, after a year of restless nights in hotel beds across three continents, our founders noticed something: the only nights they slept deeply were in the old, hand-made beds of family-run inns.",
      "They spent two years with a retired mattress-maker in Mysuru, learning how wool is carded, how a tuft is tied, and why patience is the most important material of all.",
    ],
    image: IMG.sleepMono,
    alt: "Someone sleeping deeply beneath white linen",
    detail: IMG.cushion,
  },
  {
    n: "02",
    eyebrow: "The workshop",
    title: "Twelve hours. Forty hands. One mattress.",
    body: [
      "Our atelier sits among coconut groves outside Bengaluru. Every Shakshi is built to order by a single team, who sign the label once the final tuft is tied.",
      "Edges are hand-stitched, layers laid by eye and by feel, and every mattress rests for a day before it leaves us, so the materials can settle into each other.",
    ],
    image: IMG.artisan,
    alt: "An artisan working with leather and tools at a wooden bench",
    detail: IMG.rail,
  },
  {
    n: "03",
    eyebrow: "The materials",
    title: "Gathered gently, from the world's softest places.",
    body: [
      "Merino wool from family farms in New Zealand's South Island. Natural latex tapped from rubber trees in Kerala. Long-staple organic cotton, grown and spun in Gujarat. Coconut coir from the backwaters, for a base that breathes.",
      "We know every supplier by name, and we visit each of them every year.",
    ],
    image: IMG.sheep,
    alt: "A flock of woolly sheep in a green pasture",
    detail: IMG.linen,
  },
  {
    n: "04",
    eyebrow: "The promise",
    title: "Rest well, and let the earth rest too.",
    body: [
      "Ninety-two percent of every Shakshi is natural or recycled. Our coils are made from reclaimed steel, our packaging is paper and cotton, never plastic, and every returned mattress is refurbished for a shelter or recycled completely.",
      "For each mattress we make, we plant a native tree in the Western Ghats. There are now more than forty thousand.",
    ],
    image: IMG.forest,
    alt: "Sunlight falling through a quiet forest",
    detail: IMG.mist,
  },
];

const STATS = [
  { to: 92, suffix: "%", label: "Natural or recycled materials" },
  { to: 12, suffix: " hrs", label: "Of handwork in every mattress" },
  { to: 40000, suffix: "+", label: "Native trees planted" },
  { to: 0, suffix: "", label: "Plastic in our packaging" },
];

export default function AboutPage() {
  return (
    <>
      <section data-dark-hero className="relative h-[100svh] min-h-[620px] overflow-hidden bg-midnight text-pearl" aria-labelledby="about-title">
        <Parallax amount={80} className="absolute inset-0">
          <Img src={IMG.suiteDusk} alt="" preload sizes="100vw" dark wrapperClassName="absolute inset-0" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/45 to-midnight/30" />
        <div className="container-lux relative flex h-full flex-col justify-end pb-20 lg:pb-28">
          <Reveal>
            <p className="eyebrow text-gold">Craftsmanship</p>
          </Reveal>
          <h1 id="about-title" className="display mt-5 max-w-4xl text-5xl sm:text-7xl lg:text-8xl">
            <RevealText text="Made slowly, for those who rest deeply." delay={0.2} />
          </h1>
        </div>
      </section>

      <section className="container-lux py-24 text-center lg:py-36">
        <Reveal>
          <p className="mx-auto max-w-3xl font-serif text-3xl font-light leading-snug sm:text-4xl lg:text-5xl">
            &ldquo;A good mattress should disappear the moment you lie down. Everything we do is in service of that <em className="text-gold-ink">quiet vanishing</em>.&rdquo;
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="eyebrow mt-8 text-stone">Meera &amp; Aarav Nair, founders</p>
        </Reveal>
      </section>

      {CHAPTERS.map((c, i) => {
        const flip = i % 2 === 1;
        return (
          <section key={c.n} className="container-lux grid items-center gap-12 py-16 lg:grid-cols-12 lg:gap-10 lg:py-28" aria-labelledby={`ch-${c.n}`}>
            <div className={`relative lg:col-span-7 ${flip ? "lg:order-2 lg:col-start-6" : ""}`}>
              <Parallax amount={60} className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3] lg:aspect-[5/6]">
                <Img src={c.image} alt={c.alt} sizes="(min-width: 1024px) 55vw, 100vw" wrapperClassName="absolute inset-0" />
              </Parallax>
              <Reveal delay={0.3} className={`absolute -bottom-10 w-[38%] ${flip ? "-left-4 lg:-left-12" : "-right-4 lg:-right-12"}`}>
                <Img src={c.detail} alt="" sizes="20vw" wrapperClassName="aspect-[3/4] shadow-lift" />
              </Reveal>
            </div>
            <div className={`pt-10 lg:col-span-4 lg:pt-0 ${flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-9"}`}>
              <Reveal>
                <p className="flex items-center gap-4">
                  <span className="font-serif text-5xl text-gold-ink">{c.n}</span>
                  <span className="eyebrow text-stone">{c.eyebrow}</span>
                </p>
              </Reveal>
              <h2 id={`ch-${c.n}`} className="display mt-6 text-4xl lg:text-5xl">
                <RevealText text={c.title} />
              </h2>
              {c.body.map((b, k) => (
                <Reveal key={k} delay={0.2 + k * 0.1}>
                  <p className="mt-6 leading-relaxed text-stone">{b}</p>
                </Reveal>
              ))}
            </div>
          </section>
        );
      })}

      <section className="mt-16 bg-midnight text-pearl linen-dark" aria-label="Shakshi in numbers">
        <div className="container-lux grid grid-cols-2 gap-y-14 py-24 lg:grid-cols-4 lg:py-28">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="border-l border-gold/30 pl-6">
              <p className="display text-5xl text-gold-soft lg:text-6xl">
                <Counter to={s.to} suffix={s.suffix} />
              </p>
              <p className="mt-3 max-w-[12rem] text-sm text-pearl/65">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-lux grid items-center gap-10 py-24 lg:grid-cols-2 lg:py-32">
        <h2 className="display text-5xl lg:text-6xl">
          <RevealText text="Come and feel the difference." />
        </h2>
        <Reveal delay={0.2} className="lg:justify-self-end">
          <p className="max-w-md text-stone">Our salons are quiet, unhurried spaces. Lie down, stay as long as you like, and let our sleep specialists guide you.</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/showroom" className="btn btn-dark">
              Book a private visit <IconArrow size={16} />
            </Link>
            <Link href="/shop" className="btn btn-outline">
              Explore mattresses
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
