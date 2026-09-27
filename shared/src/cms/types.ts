/**
 * The content model. Every storefront page is an ordered list of sections; every section has a
 * type (from the registry in ./sections) and its own editable fields. Global content (brand,
 * navigation, footer, theme, SEO, popups…) lives in one SiteConfig document.
 */

export type FieldType =
  | "text"
  | "textarea" // plain, line breaks kept
  | "richtext" // sanitised HTML from the Tiptap editor
  | "image" // media URL (+ alt stored alongside as `${key}Alt`)
  | "video"
  | "file"
  | "link"
  | "number"
  | "toggle"
  | "select"
  | "color"
  | "date"
  | "products" // list of product slugs
  | "tags" // list of short strings, typed comma-separated
  | "list"; // repeatable group of sub-fields

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  options?: { value: string; label: string }[];
  of?: Field[]; // for "list"
  itemLabel?: string; // sub-field whose value names each list item in the editor
  min?: number;
  max?: number;
};

export type SectionData = Record<string, unknown>;

export type Section = {
  id: string;
  type: string;
  hidden?: boolean;
  data: SectionData;
};

export type PageSeo = { title?: string; description?: string; ogImage?: string; noindex?: boolean };

export type PageDoc = {
  slug: string; // "" for home; nested slugs like "policies/returns" are allowed
  title: string; // name in the studio
  seo: PageSeo;
  sections: Section[];
  /** Built-in pages carry the route they power and can't be deleted. */
  system?: boolean;
};

export type NavItem = {
  label: string;
  href: string;
  /** "products" opens the products menu (mattresses, pillows, covers) on hover. */
  menu?: "" | "products";
  children?: { label: string; href: string; note?: string }[];
};

export type LinkItem = { label: string; href: string };

export type SiteConfig = {
  brand: { name: string; tagline: string; logo?: string; logoLight?: string };
  announcement: { enabled: boolean; text: string; link?: string; start?: string; end?: string };
  nav: NavItem[];
  footer: { columns: { title: string; links: LinkItem[] }[]; note: string };
  social: { network: string; url: string }[];
  contact: { phone: string; email: string; whatsapp: string; address: string };
  theme: {
    colors: { midnight: string; ivory: string; gold: string; ink: string; blush: string };
    fonts: { heading: string; body: string };
    toggles: { nightMode: boolean; ambientSound: boolean; cursor: boolean; preloader: boolean; socialProof: boolean; concierge: boolean };
    motion: "full" | "reduced" | "off";
  };
  seo: { titleTemplate: string; defaultTitle: string; description: string; ogImage?: string; favicon?: string };
  analytics: { gaId?: string; metaPixelId?: string };
  redirects: { from: string; to: string; permanent: boolean }[];
  commerce: {
    currency: string;
    gstRate: number;
    freeGiftThreshold: number;
    removalFee: number;
    metroPrefixes: string[];
    remotePrefixes: string[];
    unserviceable: string[];
  };
  popups: {
    exitIntent: { enabled: boolean; eyebrow: string; title: string; body: string; ctaText: string; ctaLink: string; offer: string; image?: string; start?: string; end?: string };
    newsletterOffer: string;
  };
  showrooms: { id: string; city: string; name: string; address: string; hours: string; phone: string; image: string; lat: number; lng: number }[];
  bedrooms: { id: string; image: string; alt: string; name: string; city: string; caption: string; tall?: boolean; spots: { ref: string; kind: "mattress" | "accessory"; x: number; y: number }[] }[];
};

/** Stored shape for any draftable document (pages, site config). */
export type Draftable<T> = { draft: T; published: T | null; publishedAt?: string; updatedAt: string; updatedBy?: string };

/** `*words*` in short text fields become <em> accents. Returns alternating plain/emphasis chunks. */
export function emphasis(text: string): { text: string; em: boolean }[] {
  return String(text ?? "")
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((t) => (t.startsWith("*") && t.endsWith("*") && t.length > 2 ? { text: t.slice(1, -1), em: true } : { text: t, em: false }));
}

export const newId = () => Math.random().toString(36).slice(2, 10);
