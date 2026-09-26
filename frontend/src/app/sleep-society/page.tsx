import type { Metadata } from "next";
import Link from "next/link";
import { TIERS, POINTS, REFERRAL_REWARD } from "@shakshi/shared/orders";
import { formatINR } from "@shakshi/shared/utils";
import { IMG } from "@shakshi/shared/images";
import { Img } from "@/components/ui/Img";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { NewsletterForm } from "@/components/features/NewsletterForm";
import { IconArrow, IconCheck } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "The Sleep Society · Rewards & Referrals",
  description: "Earn points on every purchase, review and referral. Rise through three tiers of Shakshi membership, and gift friends a better night.",
  alternates: { canonical: "/sleep-society" },
};

const EARN = [
  { pts: `${POINTS.perHundredRupees} point`, per: "for every ₹100 you spend" },
  { pts: `${POINTS.review} points`, per: "for each review you write" },
  { pts: `${POINTS.referral.toLocaleString("en-IN")} points`, per: "when a friend orders with your link" },
  { pts: `${POINTS.journalWeek} points`, per: "for each week you keep your sleep journal" },
];

export default function SleepSocietyPage() {
  return (
    <>
      <section data-dark-hero className="relative overflow-hidden bg-midnight pb-24 pt-40 text-pearl linen-dark lg:pb-32 lg:pt-48" aria-labelledby="society-title">
        <Img src={IMG.stars} alt="" sizes="100vw" dark preload wrapperClassName="absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/40 via-midnight/70 to-midnight" />
        <div className="container-lux relative">
          <Reveal>
            <p className="eyebrow text-gold">The Sleep Society</p>
          </Reveal>
          <h1 id="society-title" className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
            <RevealText text="Rest well. Be rewarded for it." delay={0.2} />
          </h1>
          <Reveal delay={0.4}>
            <p className="mt-6 max-w-xl text-pearl/70">Every Shakshi sleeper is a member. Earn points as you shop, review and share, and rise through three circles of quiet privileges.</p>
            <Link href="/account#rewards" className="btn btn-gold mt-10">
              See your points <IconArrow size={16} />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="container-lux py-24 lg:py-32" aria-labelledby="tiers-title">
        <h2 id="tiers-title" className="sr-only">
          Tiers
        </h2>
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

      <section className="border-y border-ink/10 bg-ivory-2/50 linen" aria-labelledby="earn-title">
        <div className="container-lux grid gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <Reveal>
            <p className="eyebrow text-gold-ink">How points gather</p>
            <h2 id="earn-title" className="display mt-4 text-4xl lg:text-5xl">
              Gently, and all the time.
            </h2>
          </Reveal>
          <ul className="grid gap-6 sm:grid-cols-2">
            {EARN.map((e, i) => (
              <Reveal as="li" key={e.per} delay={i * 0.08} className="border-l border-gold/40 pl-5">
                <p className="font-serif text-3xl">{e.pts}</p>
                <p className="mt-1 text-sm text-stone">{e.per}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-lux grid items-center gap-12 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32" aria-labelledby="refer-title">
        <Reveal>
          <Img src={IMG.elegant} alt="A bedroom made ready for a guest" sizes="(min-width: 1024px) 45vw, 100vw" wrapperClassName="aspect-[4/3]" />
        </Reveal>
        <div>
          <Reveal>
            <p className="eyebrow text-gold-ink">Refer a friend</p>
            <h2 id="refer-title" className="display mt-4 text-4xl lg:text-5xl">
              Give {formatINR(REFERRAL_REWARD)}. Get {formatINR(REFERRAL_REWARD)}.
            </h2>
            <p className="mt-5 leading-relaxed text-stone">Share your personal link. Your friend takes {formatINR(REFERRAL_REWARD)} off their first mattress, and when they order, you receive the same in Shakshi credit, plus 1,000 points.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/account#rewards" className="btn btn-dark">
                Get your link
              </Link>
              <Link href="/gift-cards" className="btn btn-outline">
                Send a gift card instead
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-midnight text-pearl linen-dark" aria-labelledby="letters-title">
        <div className="container-lux grid gap-10 py-20 lg:grid-cols-2">
          <h2 id="letters-title" className="display text-4xl lg:text-5xl">
            One quiet letter a month.
          </h2>
          <div>
            <p className="text-pearl/70">Rituals for better nights, first access to limited editions, and invitations to salon evenings.</p>
            <NewsletterForm dark />
          </div>
        </div>
      </section>
    </>
  );
}
