import type { Metadata } from "next";
import { Configurator } from "@/components/features/Configurator";
import { RevealText, Reveal } from "@/components/ui/Reveal";

export const metadata: Metadata = {
  title: "Build Your Bed",
  description: "Compose your Shakshi: choose the mattress, size, cover colour, pillows and frame, and watch your bed come to life in 3D.",
  alternates: { canonical: "/build-your-bed" },
};

export default function BuildYourBedPage() {
  return (
    <div className="container-lux pb-28 pt-32 lg:pt-36">
      <header className="mb-10 max-w-2xl">
        <Reveal>
          <p className="eyebrow text-gold-ink">Build your bed</p>
        </Reveal>
        <h1 className="display mt-4 text-5xl sm:text-6xl">
          <RevealText text="Compose your perfect night." />
        </h1>
      </header>
      <Configurator />
    </div>
  );
}
