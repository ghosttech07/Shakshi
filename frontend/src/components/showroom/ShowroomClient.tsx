"use client";

import { useState } from "react";
import { Showrooms } from "./Showrooms";
import { Booking } from "./Booking";
import { SHOWROOMS } from "@shakshi/shared/products";
import { SectionHeading } from "@/components/ui/Bits";
import { scrollToTarget } from "@/components/layout/SmoothScroll";

export function ShowroomClient({ initialCity, initialKind }: { initialCity: string; initialKind?: "salon" | "home" | "video" }) {
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
          <SectionHeading eyebrow="Reserve" title={<span id="book-title">A private <em>visit</em>, a home trial, or a call.</span>} intro="An unhurried hour in a salon, a specialist in your own bedroom, or fifteen free minutes on video. Whichever feels easiest." className="mb-14" />
          <Booking salon={salon} setSalon={setSalon} initialKind={initialKind} />
        </div>
      </section>
    </>
  );
}
