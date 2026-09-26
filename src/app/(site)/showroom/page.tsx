import type { Metadata } from "next";
import { ShowroomClient } from "@/components/showroom/ShowroomClient";
import { ContactForm } from "@/components/showroom/ContactForm";
import { Reveal, RevealText } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Bits";

export const metadata: Metadata = {
  title: "Showrooms & Contact",
  description: "Visit a Shakshi salon in Mumbai, New Delhi, Bengaluru or Hyderabad, book a home trial, or speak with a sleep concierge by phone or WhatsApp.",
  alternates: { canonical: "/showroom" },
};

export default async function ShowroomPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city } = await searchParams;
  return (
    <>
      <header className="container-lux pb-14 pt-36 lg:pb-20 lg:pt-44">
        <Reveal>
          <p className="eyebrow text-gold-ink">Showrooms &amp; contact</p>
        </Reveal>
        <h1 className="display mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
          <RevealText text="Some things must be felt to be believed." />
        </h1>
      </header>
      <ShowroomClient initialCity={city ?? ""} />
      <section id="contact" className="container-lux scroll-mt-24 py-24 lg:py-32" aria-labelledby="contact-title">
        <SectionHeading eyebrow="Contact" title={<span id="contact-title">We&rsquo;re always <em>awake</em> for you.</span>} className="mb-14" />
        <ContactForm />
      </section>
    </>
  );
}
