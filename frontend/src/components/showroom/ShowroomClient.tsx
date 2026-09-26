"use client";

import { useState } from "react";
import { Showrooms } from "./Showrooms";
import { Booking } from "./Booking";
import { SHOWROOMS } from "@shakshi/shared/products";
import { SectionHeading } from "@/components/ui/Bits";
import { scrollToTarget } from "@/components/layout/SmoothScroll";

export function ShowroomClient({ initialCity }: { initialCity: string }) {
  const [salon, setSalon] = useState(SHOWROOMS.some((s) => s.id === initialCity) ? initialCity : SHOWROOMS[0].id);
  return (
    <>
      <section className="container-lux pb-24" aria-label="Salon locations">
        <Showrooms
          active={salon}
          onSelect={setSalon}
          onBook={(id) => {
            setSalon(id);
            scrollToTarget("#book");
          }}
        />
      </section>
      <section id="book" className="scroll-mt-24 border-t border-ink/10 bg-ivory-2/50 linen" aria-labelledby="book-title">
        <div className="container-lux py-24 lg:py-32">
          <SectionHeading eyebrow="Reserve" title={<span id="book-title">Book a private <em>visit</em>, or a home trial.</span>} intro="An hour, just for you. Lie down on every bed, compare the feel, and leave with a clear sense of your perfect night." className="mb-14" />
          <Booking salon={salon} setSalon={setSalon} />
        </div>
      </section>
    </>
  );
}
