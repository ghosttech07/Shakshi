import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { phoneHref } from "@shakshi/shared/settings";
import type { SiteConfig } from "@shakshi/shared/cms/types";
import { IconPhone, IconWhatsApp, IconMail } from "@/components/ui/Icons";

export function Footer({ site }: { site: SiteConfig }) {
  const settings = site.contact;
  return (
    <footer className="relative bg-midnight text-pearl linen-dark">
      <div className="container-lux pb-10 pt-20 lg:pt-28">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_2fr]">
          <div className="max-w-sm">
            <Logo variant="lockup" tone="light" className="h-20 sm:h-24" />
            <p className="mt-6 font-serif text-2xl font-light leading-snug text-pearl/85">{site.footer.note}</p>
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
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 xl:grid-cols-5">
            {site.footer.columns.map((c) => (
              <nav key={c.title} aria-label={c.title}>
                <h3 className="eyebrow font-sans text-gold">{c.title}</h3>
                <ul className="mt-6 space-y-3 text-sm text-pearl/70">
                  {c.links.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href} className="link-lux hover:text-pearl">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            {site.showrooms.length > 0 && <div>
              <h3 className="eyebrow font-sans text-gold">Salons</h3>
              <ul className="mt-6 space-y-3 text-sm text-pearl/70">
                {site.showrooms.map((s) => (
                  <li key={s.id}>
                    <Link href={`/showroom?city=${s.id}`} className="link-lux hover:text-pearl">
                      {s.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>}
          </div>
          {site.social.length > 0 && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-pearl/60 lg:col-start-2">
              {site.social.map((x) => (
                <li key={x.url}>
                  <a href={x.url} target="_blank" rel="noopener noreferrer" className="link-lux hover:text-gold">
                    {x.network}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="gold-rule mt-20" />
        <div className="mt-8 flex flex-col gap-4 text-xs text-pearl/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.brand.name}®. {settings.address}</p>
          <p className="tracking-[0.2em] uppercase">100 nights · 10 years · White-glove, always</p>
        </div>
      </div>
    </footer>
  );
}
