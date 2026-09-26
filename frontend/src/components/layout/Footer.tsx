import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { SHOWROOMS } from "@shakshi/shared/products";
import { phoneHref } from "@shakshi/shared/settings";
import type { StoreSettings } from "@shakshi/shared/records";
import { IconPhone, IconWhatsApp, IconMail } from "@/components/ui/Icons";

const COLS = [
  {
    title: "Mattresses",
    links: [
      { href: "/mattress/cirrus", label: "The Cirrus" },
      { href: "/mattress/signature", label: "The Shakshi Signature" },
      { href: "/mattress/lumen", label: "The Lumen" },
      { href: "/mattress/atelier", label: "The Atelier" },
      { href: "/mattress/sovereign", label: "The Sovereign" },
      { href: "/build-your-bed", label: "Build Your Bed" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/quiz", label: "Sleep Quiz" },
      { href: "/sleep-studio", label: "Sleep Studio" },
      { href: "/sleep-library", label: "Sleep Library" },
      { href: "/real-bedrooms", label: "Real Bedrooms" },
      { href: "/about", label: "Craftsmanship" },
    ],
  },
  {
    title: "The House",
    links: [
      { href: "/account", label: "Your Account" },
      { href: "/sleep-society", label: "Sleep Society" },
      { href: "/gift-cards", label: "Gift Cards" },
      { href: "/hospitality", label: "Hospitality & Trade" },
      { href: "/setup", label: "Setup Guide" },
      { href: "/showroom#contact", label: "Contact" },
    ],
  },
];

export function Footer({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="relative bg-midnight text-pearl linen-dark">
      <div className="container-lux pb-10 pt-20 lg:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo variant="lockup" tone="light" className="h-20 sm:h-24" />
            <p className="mt-6 font-serif text-2xl font-light leading-snug text-pearl/85">Crafted for the deepest kind of rest.</p>
            <ul className="mt-8 space-y-3 text-sm text-pearl/70">
              <li>
                <a href={phoneHref(settings.phone)} className="inline-flex items-center gap-3 hover:text-gold">
                  <IconPhone size={18} className="text-gold" /> {settings.phone}
                </a>
              </li>
              <li>
                <a href={settings.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 hover:text-gold">
                  <IconWhatsApp size={18} className="text-gold" /> WhatsApp a concierge
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-3 hover:text-gold">
                  <IconMail size={18} className="text-gold" /> {settings.email}
                </a>
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {COLS.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h3 className="eyebrow font-sans text-gold">{c.title}</h3>
                <ul className="mt-6 space-y-3 text-sm text-pearl/70">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="link-lux hover:text-pearl">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <div>
              <h3 className="eyebrow font-sans text-gold">Salons</h3>
              <ul className="mt-6 space-y-3 text-sm text-pearl/70">
                {SHOWROOMS.map((s) => (
                  <li key={s.id}>
                    <Link href={`/showroom?city=${s.id}`} className="link-lux hover:text-pearl">
                      {s.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="gold-rule mt-20" />
        <div className="mt-8 flex flex-col gap-4 text-xs text-pearl/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Shakshi®. {settings.address}</p>
          <p className="tracking-[0.2em] uppercase">100 nights · 10 years · White-glove, always</p>
        </div>
      </div>
    </footer>
  );
}
