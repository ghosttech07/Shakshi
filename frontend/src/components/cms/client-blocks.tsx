"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCatalog } from "@/lib/catalog-context";
import { useSite } from "@/lib/site-context";
import { ProductCard } from "@/components/commerce/ProductCard";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/Bits";
import { IconArrow } from "@/components/ui/Icons";
import { Showrooms } from "@/components/showroom/Showrooms";
import { Booking } from "@/components/showroom/Booking";
import { ContactForm } from "@/components/showroom/ContactForm";
import { scrollToTarget } from "@/components/layout/SmoothScroll";
import { Emph, fieldFn, str } from "./text";

type Props = { d: Record<string, unknown>; edit?: boolean };

/** A hand-picked row of mattresses from the live catalogue. */
export function ProductGrid({ d, edit }: Props) {
  const f = fieldFn(edit);
  const { get } = useCatalog();
  const items = (Array.isArray(d.products) ? (d.products as string[]) : []).map((s) => get(s)).filter((p) => !!p);
  return (
    <section className="container-lux py-24 lg:py-36">
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <SectionHeading eyebrow={str(d.eyebrow)} title={<Emph text={str(d.title)} />} intro={str(d.intro) || undefined} f={f} />
        {str(d.linkText) && (
          <Reveal delay={0.2}>
            <Link href={str(d.linkHref, "/shop")} className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-ink hover:text-gold-ink" {...f("linkText")}>
              {str(d.linkText)} <IconArrow size={18} />
            </Link>
          </Reveal>
        )}
      </div>
      <div className={`mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 ${items.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3"}`} {...f("products")}>
        {items.map((p, i) => (
          <ProductCard key={p.slug} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

const SALON_EVENT = "shakshi:salon";
const fromUrl = (key: string) => (typeof location === "undefined" ? null : new URLSearchParams(location.search).get(key));

/** The salon map. "Book here" hands the chosen salon to the booking section below. */
export function ShowroomsBlock() {
  const rooms = useSite().showrooms;
  const [active, setActive] = useState(rooms[0]?.id ?? "");
  useEffect(() => {
    const city = fromUrl("city");
    if (city && rooms.some((r) => r.id === city)) setActive(city);
  }, [rooms]);
  if (!rooms.length) return null;
  const current = rooms.some((r) => r.id === active) ? active : rooms[0].id;
  return (
    <section className="container-lux pb-24" aria-label="Salon locations">
      <Showrooms
        active={current}
        onSelect={setActive}
        onBook={(id) => {
          dispatchEvent(new CustomEvent(SALON_EVENT, { detail: id }));
          scrollToTarget("#book");
        }}
      />
    </section>
  );
}

export function BookingBlock({ d, edit }: Props) {
  const f = fieldFn(edit);
  const rooms = useSite().showrooms;
  const [salon, setSalon] = useState(rooms[0]?.id ?? "");
  const [kind, setKind] = useState<"salon" | "home" | "video" | undefined>(undefined);
  useEffect(() => {
    const city = fromUrl("city");
    if (city && rooms.some((r) => r.id === city)) setSalon(city);
    const k = fromUrl("kind");
    if (k === "video" || k === "home") setKind(k);
    const pick = (e: Event) => setSalon((e as CustomEvent<string>).detail);
    addEventListener(SALON_EVENT, pick);
    return () => removeEventListener(SALON_EVENT, pick);
  }, [rooms]);
  return (
    <section id="book" className="scroll-mt-24 border-t border-ink/10 bg-ivory-2/50 linen">
      <div className="container-lux py-24 lg:py-32">
        <SectionHeading eyebrow={str(d.eyebrow)} title={<Emph text={str(d.title)} />} intro={str(d.intro) || undefined} className="mb-14" f={f} />
        <Booking key={kind ?? "salon"} salon={salon} setSalon={setSalon} initialKind={kind} />
      </div>
    </section>
  );
}

export function ContactBlock({ d, edit }: Props) {
  const f = fieldFn(edit);
  return (
    <section id="contact" className="container-lux scroll-mt-24 py-24 lg:py-32">
      <SectionHeading eyebrow={str(d.eyebrow)} title={<Emph text={str(d.title)} />} className="mb-14" f={f} />
      <ContactForm />
    </section>
  );
}
