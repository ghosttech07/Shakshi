import Link from "next/link";
import { PRODUCTS, FEATURED } from "@shakshi/shared/products";
import { IMG } from "@shakshi/shared/images";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Reveal, RevealText, Parallax } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Bits";
import { Img } from "@/components/ui/Img";
import { NewsletterForm } from "@/components/features/NewsletterForm";
import { IconArrow, IconHand, IconMoon, IconShield, IconTruck, IconLeaf, IconSparkle, IconBed, IconClock } from "@/components/ui/Icons";

export function FeaturedCollection() {
  const items = FEATURED.map((s) => PRODUCTS.find((p) => p.slug === s)!);
  return (
    <section className="container-lux py-24 lg:py-36" aria-labelledby="collection-title">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <SectionHeading eyebrow="The Collection" title={<span id="collection-title">Four ways to <em>drift away.</em></span>} intro="From cloud-soft to sculpted and firm, each one handcrafted, each one unhurried." />
        <Reveal delay={0.2}>
          <Link href="/shop" className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-ink hover:text-gold-ink">
            View all mattresses <IconArrow size={18} />
          </Link>
        </Reveal>
      </div>
      <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

const WHY = [
  { icon: IconHand, title: "Handcrafted", body: "Hand-tufted and finished by our artisans, never rushed." },
  { icon: IconMoon, title: "100-night trial", body: "Sleep on it for a season. Return it freely if it isn't right." },
  { icon: IconShield, title: "10-year warranty", body: "Built to hold its shape for a decade of nights." },
  { icon: IconTruck, title: "White-glove delivery", body: "Complimentary, set up in your room, packaging taken away." },
  { icon: IconLeaf, title: "Eco-certified", body: "Organic cotton, natural latex and responsibly sourced wool." },
];

export function WhyStrip() {
  return (
    <section className="border-y border-ink/10 bg-ivory-2/60 linen" aria-labelledby="why-title">
      <div className="container-lux py-20 lg:py-24">
        <Reveal>
          <h2 id="why-title" className="eyebrow text-center text-gold-ink">Why Shakshi</h2>
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-5">
          {WHY.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} as="li" delay={i * 0.1} className="flex flex-col items-center text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-gold/40 text-gold-ink">
                <Icon size={28} />
              </span>
              <h3 className="mt-5 text-2xl">{title}</h3>
              <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-stone">{body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Editorial() {
  return (
    <section className="container-lux grid items-center gap-12 py-24 lg:grid-cols-[1.15fr_1fr] lg:gap-24 lg:py-36" aria-labelledby="editorial-title">
      <div className="relative">
        <Parallax amount={50} className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/6]">
          <Img src={IMG.artisan} alt="An artisan's hands at work in the Shakshi atelier" sizes="(min-width: 1024px) 55vw, 100vw" wrapperClassName="absolute inset-0" />
        </Parallax>
        <Reveal delay={0.3} className="absolute -bottom-10 right-4 w-2/5 sm:-right-8 lg:-right-16">
          <Img src={IMG.linen} alt="Close detail of natural linen weave" sizes="30vw" wrapperClassName="aspect-square shadow-lift" />
        </Reveal>
      </div>
      <div className="pt-8 lg:pt-0">
        <Reveal>
          <p className="eyebrow text-gold-ink">The Atelier</p>
        </Reveal>
        <h2 id="editorial-title" className="display mt-5 text-5xl lg:text-6xl">
          <RevealText text="Twelve hours of patience, in every mattress." />
        </h2>
        <Reveal delay={0.2}>
          <p className="mt-7 max-w-md leading-relaxed text-stone">
            In our workshop outside Bengaluru, each Shakshi is tufted by hand, its wool layered in the old way, its edges stitched until they are perfect. We make fewer mattresses, so that each one can be extraordinary.
          </p>
          <Link href="/about" className="btn btn-outline mt-10">
            Discover our craft <IconArrow size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

const PRESS = [
  { name: "MAISON JOURNAL", quote: "The most beautiful bed we've slept in this year." },
  { name: "The Quiet Review", quote: "Quiet luxury, made literal." },
  { name: "SLEEP & DESIGN", quote: "A new standard for the Indian bedroom." },
  { name: "Lumière", quote: "Hotel-suite comfort, at home." },
  { name: "ATELIER POST", quote: "Craftsmanship you can feel." },
];

export function PressBand() {
  return (
    <section className="overflow-hidden border-y border-ink/10 py-14" aria-label="Press and awards">
      <p className="eyebrow text-center text-stone">As featured in</p>
      <div className="relative mt-8 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max gap-20 motion-safe:animate-[marquee_48s_linear_infinite] hover:[animation-play-state:paused]">
          {[...PRESS, ...PRESS].map((p, i) => (
            <li key={i} className="flex shrink-0 flex-col items-center gap-2 text-ink/70" aria-hidden={i >= PRESS.length}>
              <span className={i % 2 ? "font-serif text-3xl italic" : "font-serif text-2xl tracking-[0.3em]"}>{p.name}</span>
              <span className="text-xs text-stone">&ldquo;{p.quote}&rdquo;</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="container-lux mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs uppercase tracking-[0.25em] text-stone">
        <span className="flex items-center gap-2"><IconSparkle size={16} className="text-gold-ink" /> Design of the Year 2026</span>
        <span className="flex items-center gap-2"><IconLeaf size={16} className="text-gold-ink" /> GOTS &amp; GOLS certified</span>
        <span className="flex items-center gap-2"><IconShield size={16} className="text-gold-ink" /> CertiPUR® foams</span>
      </div>
    </section>
  );
}

const TOOLS = [
  { href: "/quiz", icon: IconSparkle, title: "The Sleep Quiz", body: "Seven gentle questions. One mattress, matched to you.", image: IMG.sleepSoft },
  { href: "/build-your-bed", icon: IconBed, title: "Build Your Bed", body: "Compose mattress, cover, pillows and frame, and watch it come alive.", image: IMG.elegant },
  { href: "/sleep-studio#calculator", icon: IconClock, title: "Sleep Calculator", body: "Wake between cycles, never in the middle of a dream.", image: IMG.moon },
];

export function ToolsTeaser() {
  return (
    <section className="container-lux py-24 lg:py-32" aria-labelledby="tools-title">
      <SectionHeading eyebrow="Personal guidance" title={<span id="tools-title">Let us <em>tailor</em> your rest.</span>} align="center" />
      <ul className="mt-14 grid gap-6 md:grid-cols-3">
        {TOOLS.map(({ href, icon: Icon, title, body, image }, i) => (
          <Reveal as="li" key={href} delay={i * 0.12}>
            <Link href={href} className="group relative block aspect-[4/5] overflow-hidden text-pearl md:aspect-[3/4]">
              <Img src={image} alt="" sizes="(min-width: 768px) 33vw, 100vw" dark wrapperClassName="absolute inset-0" className="transition-transform duration-[1600ms] ease-silk group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/85 via-midnight/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <Icon size={28} className="text-gold" />
                <h3 className="mt-4 text-3xl">{title}</h3>
                <p className="mt-2 max-w-xs text-sm text-pearl/75">{body}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-gold">
                  Begin <IconArrow size={14} className="transition-transform duration-700 ease-silk group-hover:translate-x-1.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function SleepSociety() {
  return (
    <section className="relative overflow-hidden bg-midnight text-pearl" aria-labelledby="society-title">
      <Img src={IMG.stars} alt="" sizes="100vw" dark wrapperClassName="absolute inset-0 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/80 to-midnight/30" />
      <div className="container-lux relative grid gap-10 py-24 lg:grid-cols-2 lg:py-36">
        <div>
          <Reveal>
            <p className="eyebrow text-gold">The Sleep Society</p>
          </Reveal>
          <h2 id="society-title" className="display mt-5 text-5xl lg:text-7xl">
            <RevealText text="Join the Sleep Society." />
          </h2>
        </div>
        <Reveal delay={0.2} className="self-end">
          <p className="max-w-md leading-relaxed text-pearl/70">
            Rituals for better nights, first access to limited editions, and invitations to our salons. As a welcome, a complimentary Silk Protector with your first mattress.
          </p>
          <NewsletterForm dark />
          <p className="mt-4 text-xs text-pearl/45">One quiet letter a month. Unsubscribe whenever you wish.</p>
        </Reveal>
      </div>
    </section>
  );
}
