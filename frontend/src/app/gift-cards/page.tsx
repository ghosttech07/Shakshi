import type { Metadata } from "next";
import { GiftCardBuilder } from "@/components/gifts/GiftCardBuilder";
import { Reveal, RevealText } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Gift Cards · The Gift of Deep Sleep",
  description: "A Shakshi gift card, delivered in a digital envelope. Redeemable on any mattress, pillow or linen, online or in our salons.",
  alternates: { canonical: "/gift-cards" },
};

export default function GiftCardsPage() {
  return (
    <>
      <header className="container-lux pb-14 pt-36 lg:pb-20 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">Gift cards</p>
        </Reveal>
        <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text="The kindest gift is a good night." />
        </h1>
      </header>
      <section className="container-lux pb-28" aria-label="Create a gift card">
        <GiftCardBuilder />
      </section>
    </>
  );
}
