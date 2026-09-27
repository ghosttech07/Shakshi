import { DEFAULT_SITE } from "@shakshi/shared/cms/defaults";
import type { SiteConfig } from "@shakshi/shared/cms/types";

/** DEFAULT_SITE with one sample element in every list, so `shape()` knows each list's item shape. */
export const SITE_TEMPLATE: SiteConfig = {
  ...DEFAULT_SITE,
  brand: { name: "", tagline: "", logo: "", logoLight: "" },
  announcement: { enabled: true, text: "", link: "", start: "", end: "" },
  nav: [{ label: "", href: "", menu: "", children: [{ label: "", href: "", note: "" }] }],
  footer: { columns: [{ title: "", links: [{ label: "", href: "" }] }], note: "" },
  social: [{ network: "", url: "" }],
  seo: { titleTemplate: "", defaultTitle: "", description: "", ogImage: "", favicon: "" },
  analytics: { gaId: "", metaPixelId: "" },
  redirects: [{ from: "", to: "", permanent: true }],
  commerce: { ...DEFAULT_SITE.commerce, metroPrefixes: [""], remotePrefixes: [""], unserviceable: [""] },
  popups: { exitIntent: { ...DEFAULT_SITE.popups.exitIntent, image: "", start: "", end: "" }, newsletterOffer: "" },
  showrooms: [{ id: "", city: "", name: "", address: "", hours: "", phone: "", image: "", lat: 0, lng: 0 }],
  bedrooms: [{ id: "", image: "", alt: "", name: "", city: "", caption: "", tall: false, spots: [{ ref: "", kind: "mattress", x: 50, y: 50 }] }],
};
