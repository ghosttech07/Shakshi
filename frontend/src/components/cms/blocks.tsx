import Link from "next/link";
import { TIERS } from "@shakshi/shared/orders";
import type { Article } from "@shakshi/shared/articles";
import { cn } from "@shakshi/shared/utils";
import { Reveal, RevealText, Parallax } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Bits";
import { Img } from "@/components/ui/Img";
import { IconArrow, IconBed, IconCheck, IconClock, IconGift, IconHand, IconLeaf, IconMoon, IconShield, IconSparkle, IconTruck } from "@/components/ui/Icons";
import { NewsletterForm } from "@/components/features/NewsletterForm";
import { FirmnessSimulator } from "@/components/features/FirmnessSimulator";
import { SleepCalculator } from "@/components/features/SleepCalculator";
import { SwatchRequest } from "@/components/features/SwatchRequest";
import { HospitalityForm } from "@/components/features/HospitalityForm";
import { UnboxingFilm, ExpansionTimer } from "@/components/features/SetupGuide";
import { ShopClient } from "@/components/shop/ShopClient";
import { GiftCardBuilder } from "@/components/gifts/GiftCardBuilder";
import { LibraryIndex } from "@/components/library/LibraryIndex";
import { Emph, arr, lines, num, str, type FieldFn } from "./text";

export type BlockCtx = { articles: Article[] };
export type BlockProps = { d: Record<string, unknown>; f: FieldFn; edit?: boolean; ctx: BlockCtx; first?: boolean };

const LinkArrow = ({ href, text, f, k }: { href: string; text: string; f: FieldFn; k: string }) =>
  text ? (
    <Link href={href || "/"} className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] hover:text-gold-ink" {...f(k)}>
      {text} <IconArrow size={16} />
    </Link>
  ) : null;

/** Standard heading block for sections: eyebrow, emphasised title, optional intro. */
const Heading = ({ d, f, dark, align, className, h1 }: { d: Record<string, unknown>; f: FieldFn; dark?: boolean; align?: "left" | "center"; className?: string; h1?: boolean }) =>
  str(d.title) || str(d.eyebrow) ? (
    h1 ? (
      <div className={cn(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
        {str(d.eyebrow) && (
          <Reveal>
            <p className={cn("eyebrow", dark ? "text-gold" : "text-gold-ink")} {...f("eyebrow")}>
              {str(d.eyebrow)}
            </p>
          </Reveal>
        )}
        <h1 className="display mt-5 text-5xl sm:text-6xl lg:text-7xl" {...f("title")}>
          <RevealText text={str(d.title)} />
        </h1>
      </div>
    ) : (
      <SectionHeading eyebrow={str(d.eyebrow)} title={str(d.title) ? <Emph text={str(d.title)} /> : null} intro={str(d.intro) || undefined} dark={dark} align={align} className={className} f={f} />
    )
  ) : null;

// ---------------------------------------------------------------- headers
export function PageHeader({ d, f }: BlockProps) {
  const tone = str(d.tone, "light");
  const cta = str(d.ctaText);
  if (tone === "image" || tone === "dark") {
    return (
      <section data-dark-hero className={cn("relative overflow-hidden bg-midnight text-pearl linen-dark", tone === "image" ? "flex min-h-[80svh] items-end" : "")}>
        {tone === "image" && str(d.image) && (
          <>
            <Parallax amount={70} className="absolute inset-0">
              <Img src={str(d.image)} alt="" preload sizes="100vw" dark wrapperClassName="absolute inset-0" />
            </Parallax>
            <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/55 to-midnight/35" />
          </>
        )}
        <div className={cn("container-lux relative w-full", tone === "image" ? "pb-16 pt-40 lg:pb-24" : "pb-20 pt-40 lg:pb-28 lg:pt-48")}>
          {str(d.eyebrow) && (
            <Reveal>
              <p className="eyebrow text-gold" {...f("eyebrow")}>
                {str(d.eyebrow)}
              </p>
            </Reveal>
          )}
          <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl" {...f("title")}>
            <RevealText text={str(d.title)} delay={0.2} emClassName="text-gold-soft" />
          </h1>
          {str(d.intro) && (
            <Reveal delay={0.4}>
              <p className="mt-6 max-w-xl text-pearl/70" {...f("intro")}>
                {str(d.intro)}
              </p>
            </Reveal>
          )}
          {cta && (
            <Reveal delay={0.5}>
              <Link href={str(d.ctaLink, "/")} className="btn btn-gold mt-10" {...f("ctaText")}>
                {cta} <IconArrow size={16} />
              </Link>
            </Reveal>
          )}
        </div>
      </section>
    );
  }
  return (
    <header className="container-lux pb-12 pt-36 lg:pb-16 lg:pt-44">
      {str(d.eyebrow) && (
        <Reveal>
          <p className="eyebrow text-gold-ink" {...f("eyebrow")}>
            {str(d.eyebrow)}
          </p>
        </Reveal>
      )}
      <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl" {...f("title")}>
        <RevealText text={str(d.title)} />
      </h1>
      {str(d.intro) && (
        <Reveal delay={0.3}>
          <p className="mt-6 max-w-xl text-stone" {...f("intro")}>
            {str(d.intro)}
          </p>
        </Reveal>
      )}
      {cta && (
        <Reveal delay={0.4}>
          <Link href={str(d.ctaLink, "/")} className="btn btn-dark mt-10" {...f("ctaText")}>
            {cta} <IconArrow size={16} />
          </Link>
        </Reveal>
      )}
    </header>
  );
}

// ---------------------------------------------------------------- trust & story
export function Firmness({ d, f }: BlockProps) {
  const dark = str(d.tone) === "dark";
  return (
    <section className={cn(dark && "bg-midnight text-pearl linen-dark")}>
      <div className="container-lux grid gap-14 py-24 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20 lg:py-36">
        <div>
          <Heading d={d} f={f} dark={dark} />
          {str(d.linkText) && (
            <Reveal delay={0.2} className="mt-10">
              <LinkArrow href={str(d.linkHref)} text={str(d.linkText)} f={f} k="linkText" />
            </Reveal>
          )}
        </div>
        <Reveal delay={0.1}>
          <FirmnessSimulator dark={dark} />
        </Reveal>
      </div>
    </section>
  );
}

export function FeatureGrid({ d, f }: BlockProps) {
  const tone = str(d.tone, "light");
  const items = arr<{ title: string; body: string }>(d.items);
  const cols = str(d.columns, "3");
  const dark = tone === "dark";
  const hasHeading = !!(str(d.title) || str(d.eyebrow));
  return (
    <section className={cn(tone === "linen" && "border-y border-ink/10 bg-ivory-2/50 linen", dark && "bg-midnight text-pearl linen-dark")}>
      <div className={cn("container-lux py-20 lg:py-28", hasHeading && cols === "2" && "grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24")}>
        {hasHeading && <Heading d={d} f={f} dark={dark} className={cols === "2" ? "" : "mb-14"} />}
        <ul className={cn("grid gap-x-10 gap-y-10", cols === "2" ? "sm:grid-cols-2" : "md:grid-cols-3")}>
          {items.map((it, i) => (
            <Reveal as="li" key={i} delay={i * 0.08}>
              {hasHeading && <p className={cn("font-serif text-lg", dark ? "text-gold" : "text-gold-ink")}>{String(i + 1).padStart(2, "0")}</p>}
              <h3 className={cn(hasHeading ? "mt-2 text-3xl" : "text-2xl")} {...f(`items.${i}.title`)}>
                {it.title}
              </h3>
              <p className={cn("mt-3 text-sm leading-relaxed", dark ? "text-pearl/65" : "text-stone")} {...f(`items.${i}.body`)}>
                {it.body}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Press({ d, f }: BlockProps) {
  const items = arr<{ name: string; quote: string; logo?: string }>(d.items);
  const awards = arr<{ text: string }>(d.awards);
  return (
    <section className="overflow-hidden border-y border-ink/10 py-14" aria-label="Press and awards">
      {str(d.eyebrow) && (
        <p className="eyebrow text-center text-stone" {...f("eyebrow")}>
          {str(d.eyebrow)}
        </p>
      )}
      {items.length > 0 && (
        <div className="relative mt-8 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
          <ul className="flex w-max gap-20 motion-safe:animate-[marquee_48s_linear_infinite] hover:[animation-play-state:paused]">
            {[...items, ...items].map((p, i) => (
              <li key={i} className="flex shrink-0 flex-col items-center gap-2 text-ink/70" aria-hidden={i >= items.length} {...(i < items.length ? f(`items.${i}.name`) : {})}>
                {p.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo} alt={p.name} className="h-8 w-auto opacity-70 grayscale" loading="lazy" />
                ) : (
                  <span className={i % 2 ? "font-serif text-3xl italic" : "font-serif text-2xl tracking-[0.3em]"}>{p.name}</span>
                )}
                {p.quote && <span className="text-xs text-stone">&ldquo;{p.quote}&rdquo;</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {awards.length > 0 && (
        <ul className="container-lux mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-xs uppercase tracking-[0.25em] text-stone">
          {awards.map((a, i) => (
            <li key={i} className="flex items-center gap-2" {...f(`awards.${i}.text`)}>
              <IconSparkle size={16} className="text-gold-ink" /> {a.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Newsletter({ d, f }: BlockProps) {
  return (
    <section className="relative overflow-hidden bg-midnight text-pearl">
      {str(d.image) && <Img src={str(d.image)} alt="" sizes="100vw" dark wrapperClassName="absolute inset-0 opacity-50" />}
      <div className="absolute inset-0 bg-gradient-to-r from-midnight via-midnight/80 to-midnight/30" />
      <div className="container-lux relative grid gap-10 py-24 lg:grid-cols-2 lg:py-36">
        <div>
          {str(d.eyebrow) && (
            <Reveal>
              <p className="eyebrow text-gold" {...f("eyebrow")}>
                {str(d.eyebrow)}
              </p>
            </Reveal>
          )}
          <h2 className="display mt-5 text-5xl lg:text-7xl" {...f("title")}>
            <RevealText text={str(d.title)} emClassName="text-gold-soft" />
          </h2>
        </div>
        <Reveal delay={0.2} className="self-end">
          {str(d.body) && (
            <p className="max-w-md leading-relaxed text-pearl/70" {...f("body")}>
              {str(d.body)}
            </p>
          )}
          <NewsletterForm dark />
          {str(d.footnote) && (
            <p className="mt-4 text-xs text-pearl/45" {...f("footnote")}>
              {str(d.footnote)}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- text
export function Faq({ d, f }: BlockProps) {
  const items = arr<{ q: string; a: string }>(d.items);
  return (
    <section className="container-lux py-16 lg:py-24">
      {(str(d.title) || str(d.eyebrow)) && <Heading d={d} f={f} className="mb-12" />}
      <div className="mx-auto max-w-3xl divide-y divide-ink/10 border-y border-ink/10">
        {items.map((it, i) => (
          <details key={i} className="group py-2" {...f(`items.${i}.q`)}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-serif text-2xl [&::-webkit-details-marker]:hidden">
              {it.q}
              <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/15 transition-transform duration-700 ease-silk group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="rich pb-6 text-stone" dangerouslySetInnerHTML={{ __html: it.a }} />
          </details>
        ))}
      </div>
    </section>
  );
}

export function RichText({ d, f }: BlockProps) {
  const narrow = str(d.width, "narrow") === "narrow";
  return (
    <section className="container-lux py-12 lg:py-16">
      <div className={cn(narrow ? "mx-auto max-w-2xl" : "max-w-5xl")}>
        {(str(d.title) || str(d.eyebrow)) && <Heading d={d} f={f} className="mb-10" />}
        <div className="rich text-ink/85" {...f("body")} dangerouslySetInnerHTML={{ __html: str(d.body) }} />
      </div>
    </section>
  );
}

export function Cta({ d, f }: BlockProps) {
  const dark = str(d.tone) === "dark";
  const img = str(d.image);
  return (
    <section className={cn(dark && "bg-midnight text-pearl linen-dark")}>
      <div className={cn("container-lux py-24 lg:py-32", img ? "grid items-center gap-12 lg:grid-cols-2 lg:gap-20" : "text-center")}>
        {img && (
          <Reveal {...f("image")}>
            <Img src={img} alt="" dark={dark} sizes="(min-width: 1024px) 45vw, 100vw" wrapperClassName="aspect-[4/3]" />
          </Reveal>
        )}
        <Reveal className={img ? "" : "mx-auto max-w-2xl"}>
          {str(d.eyebrow) && (
            <p className={cn("eyebrow mb-4", dark ? "text-gold" : "text-gold-ink")} {...f("eyebrow")}>
              {str(d.eyebrow)}
            </p>
          )}
          <h2 className="display text-4xl lg:text-5xl" {...f("title")}>
            <Emph text={str(d.title)} emClassName={dark ? "text-gold-soft" : undefined} />
          </h2>
          {str(d.body) && (
            <p className={cn("mt-5 leading-relaxed", dark ? "text-pearl/70" : "text-stone")} {...f("body")}>
              {str(d.body)}
            </p>
          )}
          <div className={cn("mt-8 flex flex-wrap gap-4", !img && "justify-center")}>
            {str(d.ctaText) && (
              <Link href={str(d.ctaLink, "/")} className={cn("btn", dark ? "btn-gold" : "btn-dark")} {...f("ctaText")}>
                {str(d.ctaText)}
              </Link>
            )}
            {str(d.secondaryText) && (
              <Link href={str(d.secondaryLink, "/")} className={cn("btn", dark ? "btn-outline-light" : "btn-outline")} {...f("secondaryText")}>
                {str(d.secondaryText)}
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- tools (interactive parts of built-in pages)
export const ShopCatalog = () => <ShopClient />;

const SplitTool = ({ d, f, id, children, tone, imageAspect = "aspect-square" }: BlockProps & { id: string; children: React.ReactNode; tone?: "linen"; imageAspect?: string }) => (
  <section id={id} className={cn("scroll-mt-24", tone === "linen" && "border-t border-ink/10 bg-ivory-2/50 linen")}>
    <div className="container-lux grid gap-14 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32">
      <div>
        <Heading d={d} f={f} />
        {str(d.image) && (
          <Reveal delay={0.2} className="mt-10 hidden lg:block">
            <Img src={str(d.image)} alt="" sizes="30vw" wrapperClassName={cn(imageAspect, "max-w-sm")} />
          </Reveal>
        )}
      </div>
      <Reveal delay={0.1}>{children}</Reveal>
    </div>
  </section>
);

export const SleepCalculatorBlock = (p: BlockProps) => (
  <SplitTool {...p} id="calculator">
    <SleepCalculator />
  </SplitTool>
);
export const SwatchesBlock = (p: BlockProps) => (
  <SplitTool {...p} id="swatches" tone="linen" imageAspect="aspect-[4/3]">
    <SwatchRequest />
  </SplitTool>
);
export const HospitalityFormBlock = (p: BlockProps) => (
  <SplitTool {...p} id="enquire" imageAspect="aspect-[4/5]">
    <HospitalityForm />
  </SplitTool>
);

export const LibraryIndexBlock = ({ ctx }: BlockProps) => <LibraryIndex articles={ctx.articles} />;

export const GiftBuilderBlock = () => (
  <section className="container-lux pb-28" aria-label="Create a gift card">
    <GiftCardBuilder />
  </section>
);

export const SetupFilmBlock = ({ d, f }: BlockProps) => (
  <section className="container-lux" aria-label="Unboxing film" {...f("video")}>
    <UnboxingFilm video={str(d.video) || undefined} />
  </section>
);

export const ExpansionTimerBlock = ({ d, f }: BlockProps) => (
  <section className="container-lux py-24 lg:py-32">
    <Heading d={d} f={f} className="mb-12" />
    <ExpansionTimer />
  </section>
);

export const SocietyTiers = () => (
  <section className="container-lux py-24 lg:py-32" aria-label="Membership tiers">
    <ol className="grid gap-6 md:grid-cols-3">
      {TIERS.map((t, i) => (
        <Reveal as="li" key={t.id} delay={i * 0.12} className={i === 2 ? "bg-midnight p-8 text-pearl linen-dark" : "border border-ink/10 p-8"}>
          <p className={`eyebrow ${i === 2 ? "text-gold" : "text-gold-ink"}`}>{t.min ? `From ${t.min.toLocaleString("en-IN")} points` : "On your first order"}</p>
          <p className="display mt-4 text-4xl">{t.name}</p>
          <ul className="mt-6 space-y-3 text-sm">
            {t.perks.map((p) => (
              <li key={p} className="flex gap-3">
                <IconCheck size={16} className={`mt-0.5 shrink-0 ${i === 2 ? "text-gold" : "text-gold-ink"}`} />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </ol>
  </section>
);

export function SleepStudioHero({ d, f }: BlockProps) {
  return (
    <section data-dark-hero className="relative overflow-hidden bg-midnight pb-24 pt-36 text-pearl linen-dark lg:pb-32 lg:pt-44">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_50%_at_75%_20%,rgb(201_169_110/0.12),transparent)]" />
      <div className="container-lux relative grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          {str(d.eyebrow) && (
            <Reveal>
              <p className="eyebrow text-gold" {...f("eyebrow")}>
                {str(d.eyebrow)}
              </p>
            </Reveal>
          )}
          <h1 className="display mt-5 text-5xl sm:text-6xl lg:text-7xl" {...f("title")}>
            <RevealText text={str(d.title)} emClassName="text-gold-soft" />
          </h1>
          {str(d.intro) && (
            <Reveal delay={0.3}>
              <p className="mt-6 max-w-md leading-relaxed text-pearl/65" {...f("intro")}>
                {str(d.intro)}
              </p>
            </Reveal>
          )}
        </div>
        <Reveal delay={0.2}>
          <FirmnessSimulator dark />
        </Reveal>
      </div>
    </section>
  );
}
