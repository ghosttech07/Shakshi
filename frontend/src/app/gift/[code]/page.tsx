import type { Metadata } from "next";
import { GiftReveal } from "@/components/gifts/GiftReveal";

export const metadata: Metadata = {
  title: "A gift for you",
  robots: { index: false, follow: false },
};

export default async function GiftPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <section data-dark-hero className="relative min-h-[100svh] overflow-hidden bg-midnight px-5 pb-24 pt-36 text-pearl linen-dark">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_35%,rgb(201_169_110/0.16),transparent)]" />
      <div className="relative">
        <h1 className="sr-only">Your Shakshi gift</h1>
        <GiftReveal code={decodeURIComponent(code).toUpperCase()} />
      </div>
    </section>
  );
}
