import type { Field } from "./types";
import { BODY_FONTS, HEADING_FONTS } from "./theme";

/** The studio's Site & theme screen: each group edits one part of SiteConfig (by dotted path). */
export type SiteGroup = { id: string; title: string; description: string; path: string; fields: Field[] };

const t = (key: string, label: string, help?: string): Field => ({ key, label, type: "text", help });
const ta = (key: string, label: string, help?: string): Field => ({ key, label, type: "textarea", help });
const tog = (key: string, label: string, help?: string): Field => ({ key, label, type: "toggle", help });
const link = (key: string, label: string): Field => ({ key, label, type: "link" });
const img = (key: string, label: string): Field => ({ key, label, type: "image" });
const num = (key: string, label: string, help?: string): Field => ({ key, label, type: "number", help });
const color = (key: string, label: string, help?: string): Field => ({ key, label, type: "color", help });
const date = (key: string, label: string, help?: string): Field => ({ key, label, type: "date", help });
const tags = (key: string, label: string, help?: string): Field => ({ key, label, type: "tags", help });
const sel = (key: string, label: string, options: readonly string[] | [string, string][], help?: string): Field => ({
  key,
  label,
  type: "select",
  help,
  options: options.map((o) => (Array.isArray(o) ? { value: o[0], label: o[1] } : { value: o as string, label: o as string })),
});

export const SITE_GROUPS: SiteGroup[] = [
  {
    id: "brand",
    title: "Brand",
    description: "Name, tagline and logo files. Leave the logo empty to use the built-in Shakshi mark.",
    path: "brand",
    fields: [t("name", "Brand name"), t("tagline", "Tagline"), img("logo", "Logo (for light backgrounds)"), img("logoLight", "Logo (for dark backgrounds)")],
  },
  {
    id: "announcement",
    title: "Announcement bar",
    description: "The slim bar above the header. Optional dates schedule it automatically.",
    path: "announcement",
    fields: [tog("enabled", "Show the bar", "Show the announcement bar"), t("text", "Message"), link("link", "Link (optional)"), date("start", "Show from (optional)"), date("end", "Show until (optional)")],
  },
  {
    id: "nav",
    title: "Navigation",
    description: "The main menu. An item with sub-links becomes a dropdown (like Discover).",
    path: "",
    fields: [{ key: "nav", label: "Menu items", type: "list", itemLabel: "label", of: [t("label", "Label"), link("href", "Link (leave empty for a dropdown)"), { key: "children", label: "Dropdown links", type: "list", itemLabel: "label", of: [t("label", "Label"), link("href", "Link"), t("note", "Short note")] }] }],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Link columns and the line beneath the logo.",
    path: "footer",
    fields: [t("note", "Line beneath the logo"), { key: "columns", label: "Columns", type: "list", itemLabel: "title", of: [t("title", "Heading"), { key: "links", label: "Links", type: "list", itemLabel: "label", of: [t("label", "Label"), link("href", "Link")] }] }],
  },
  {
    id: "contact",
    title: "Contact & social",
    description: "Used in the footer, contact page, invoices and the concierge.",
    path: "",
    fields: [
      { key: "contact", label: "Contact", type: "list", max: 0, of: [] }, // placeholder replaced below
    ],
  },
  {
    id: "colors",
    title: "Colours",
    description: "The palette, applied across the site. Night mode keeps its own darker palette.",
    path: "theme.colors",
    fields: [color("midnight", "Midnight (dark surfaces)"), color("ivory", "Ivory (page background)"), color("gold", "Gold (accents and buttons)"), color("ink", "Ink (text)"), color("blush", "Blush (soft accents)")],
  },
  {
    id: "type",
    title: "Typography",
    description: "Curated pairings that suit the brand. Only the chosen fonts are downloaded by visitors.",
    path: "theme.fonts",
    fields: [sel("heading", "Headings", HEADING_FONTS), sel("body", "Body text", BODY_FONTS)],
  },
  {
    id: "features",
    title: "Features & motion",
    description: "Turn site-wide touches on or off, and set how much everything moves.",
    path: "theme",
    fields: [
      sel("motion", "Animation intensity", [["full", "Full"], ["reduced", "Reduced (gentle fades only)"], ["off", "Off"]], "Visitors who ask their device for less motion always get fades only."),
      tog("toggles.nightMode", "Night mode", "Moonlit palette after 7pm (visitors can switch it)"),
      tog("toggles.ambientSound", "Ambient sound", "Rain, ocean and hush sounds (always off until a visitor turns them on)"),
      tog("toggles.cursor", "Custom cursor", "The soft gold cursor on desktop"),
      tog("toggles.preloader", "Preloader", "The breathing logo on first visit"),
      tog("toggles.socialProof", "Social proof", "Quiet “someone in Pune just ordered…” notes"),
      tog("toggles.concierge", "Sleep Concierge", "The AI concierge button"),
    ],
  },
  {
    id: "seo",
    title: "Search & sharing",
    description: "Defaults for every page. Each page can override them in its own settings.",
    path: "seo",
    fields: [t("defaultTitle", "Home page title"), t("titleTemplate", "Title pattern", "%s is replaced by the page title, e.g. “%s · Shakshi”"), ta("description", "Default description"), img("ogImage", "Default social sharing image"), img("favicon", "Browser tab icon (square PNG)")],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Tracking starts only when an ID is filled in.",
    path: "analytics",
    fields: [t("gaId", "Google Analytics 4 measurement ID", "Looks like G-XXXXXXXXXX"), t("metaPixelId", "Meta Pixel ID", "A number, 15–16 digits")],
  },
  {
    id: "redirects",
    title: "Redirects",
    description: "Send old addresses to new ones, e.g. /old-page → /new-page.",
    path: "",
    fields: [{ key: "redirects", label: "Redirects", type: "list", itemLabel: "from", of: [t("from", "From (e.g. /old-page)"), link("to", "To"), tog("permanent", "Permanent", "Permanent (tells search engines the page has moved for good)")] }],
  },
  {
    id: "commerce",
    title: "Delivery, tax & pricing",
    description: "Delivery areas by pincode, GST, the free-gift threshold and the removal fee.",
    path: "commerce",
    fields: [
      tags("metroPrefixes", "Metro pincode prefixes (3–5 day white-glove)", "First two digits, comma-separated: 11, 40, 56…"),
      tags("remotePrefixes", "Extended network prefixes (9–14 days)", "First two digits, comma-separated"),
      tags("unserviceable", "Pincodes we can't deliver to yet", "Prefixes of any length, comma-separated"),
      num("gstRate", "GST rate (%)"),
      num("freeGiftThreshold", "Free Cloud Pillows above (₹)"),
      num("removalFee", "Old-mattress removal fee (₹)"),
      t("currency", "Currency code"),
    ],
  },
  {
    id: "popups",
    title: "Popups & offers",
    description: "The exit-intent invitation and the Sleep Society welcome offer.",
    path: "popups",
    fields: [
      tog("exitIntent.enabled", "Exit-intent popup", "Show once per visit when a desktop visitor heads for the address bar"),
      t("exitIntent.eyebrow", "Eyebrow"),
      t("exitIntent.title", "Title", "Wrap words in *asterisks* for an italic accent."),
      ta("exitIntent.body", "Text"),
      t("exitIntent.ctaText", "Button text"),
      link("exitIntent.ctaLink", "Button link"),
      ta("exitIntent.offer", "Offer line"),
      img("exitIntent.image", "Image"),
      date("exitIntent.start", "Show from (optional)"),
      date("exitIntent.end", "Show until (optional)"),
      t("newsletterOffer", "Newsletter welcome offer"),
    ],
  },
  {
    id: "showrooms",
    title: "Showrooms",
    description: "Salon locations for the map, bookings and footer.",
    path: "",
    fields: [
      {
        key: "showrooms",
        label: "Salons",
        type: "list",
        itemLabel: "city",
        of: [t("id", "Short id (e.g. mumbai)"), t("city", "City"), t("name", "Salon name"), ta("address", "Address"), t("hours", "Opening hours"), t("phone", "Phone"), img("image", "Photo"), num("lat", "Latitude"), num("lng", "Longitude")],
      },
    ],
  },
  {
    id: "bedrooms",
    title: "Real bedrooms",
    description: "Customer photos with shoppable hotspots (x and y are percentages across the photo).",
    path: "",
    fields: [
      {
        key: "bedrooms",
        label: "Bedrooms",
        type: "list",
        itemLabel: "name",
        of: [
          t("id", "Short id"),
          img("image", "Photo"),
          t("alt", "Alt text"),
          t("name", "Sleeper's name"),
          t("city", "City"),
          ta("caption", "Caption"),
          tog("tall", "Tall photo", "Portrait photo (spans two rows)"),
          { key: "spots", label: "Hotspots", type: "list", itemLabel: "ref", of: [t("ref", "Product (mattress slug or accessory id)"), sel("kind", "Kind", [["mattress", "Mattress"], ["accessory", "Accessory"]]), num("x", "Across (%)"), num("y", "Down (%)")] },
        ],
      },
    ],
  },
];

// Contact and social share one screen.
SITE_GROUPS[SITE_GROUPS.findIndex((g) => g.id === "contact")] = {
  id: "contact",
  title: "Contact & social",
  description: "Used in the footer, contact page, invoices and the concierge.",
  path: "",
  fields: [
    t("contact.phone", "Phone"),
    t("contact.email", "Email"),
    link("contact.whatsapp", "WhatsApp link (https://wa.me/…)"),
    ta("contact.address", "Registered address"),
    { key: "social", label: "Social links", type: "list", itemLabel: "network", of: [t("network", "Network (e.g. Instagram)"), link("url", "Profile address")] },
  ],
};
