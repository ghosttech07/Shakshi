import { CONTACT, SHOWROOMS, FREE_GIFT_THRESHOLD } from "../products";
import { DEFAULT_SETTINGS } from "../settings";
import { SECTIONS } from "./sections";
import type { PageDoc, Section, SectionData, SiteConfig } from "./types";

/** Starting content for a fresh install: exactly what the site shipped with. */
export const DEFAULT_SITE: SiteConfig = {
  brand: { name: "Shakshi", tagline: "A Commitment for Complete Rest" },
  announcement: { enabled: false, text: DEFAULT_SETTINGS.announcement.text, link: DEFAULT_SETTINGS.announcement.link },
  nav: [
    { label: "Products", href: "/shop", menu: "products" },
    {
      label: "About",
      href: "/about",
      children: [
        { label: "Our Story", href: "/about", note: "The thread, from 2012" },
        { label: "Sleep Studio", href: "/sleep-studio", note: "Feel the firmness, time your cycles" },
        { label: "Sleep Library", href: "/sleep-library", note: "Essays on resting well" },
        { label: "Showrooms & Contact", href: "/showroom", note: "Visit a salon, book a call, or write to us" },
        { label: "FAQ", href: "/faq", note: "Delivery, payment, warranty and care" },
      ],
    },
  ],
  footer: {
    columns: [
      { title: "Products", links: [{ label: "Mattresses", href: "/shop" }, { label: "Pillows", href: "/shop/pillows" }, { label: "Mattress Covers", href: "/shop/covers" }] },
      { title: "About", links: [{ label: "Sleep Studio", href: "/sleep-studio" }, { label: "Sleep Library", href: "/sleep-library" }, { label: "Our Story", href: "/about" }] },
      { title: "The House", links: [{ label: "Your Account", href: "/account" }, { label: "FAQ", href: "/faq" }] },
      { title: "Policies", links: [{ label: "Warranty", href: "/policies/warranty" }, { label: "Returns", href: "/policies/returns" }, { label: "Privacy", href: "/policies/privacy" }, { label: "Terms", href: "/policies/terms" }] },
    ],
    note: "Crafted for the deepest kind of rest.",
  },
  social: [],
  contact: { phone: CONTACT.phone, email: CONTACT.email, whatsapp: CONTACT.whatsapp, address: DEFAULT_SETTINGS.address },
  theme: {
    colors: { midnight: "#0e1420", ivory: "#f5f0e8", gold: "#c9a96e", ink: "#1c2230", blush: "#e6c7bd" },
    fonts: { heading: "Cormorant Garamond", body: "Manrope" },
    toggles: { nightMode: true, ambientSound: true, cursor: true, preloader: true, socialProof: true, concierge: true },
    motion: "full",
  },
  seo: {
    titleTemplate: "%s · Shakshi",
    defaultTitle: "Shakshi · A Commitment for Complete Rest",
    description: "Handcrafted luxury mattresses for the deepest kind of rest. 10-year warranty and complimentary white-glove delivery across India.",
    ogImage: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&h=630&fit=crop&q=75",
  },
  analytics: {},
  redirects: [],
  commerce: {
    currency: "INR",
    gstRate: 18,
    freeGiftThreshold: FREE_GIFT_THRESHOLD,
    removalFee: 1500,
    metroPrefixes: DEFAULT_SETTINGS.metroPrefixes,
    remotePrefixes: DEFAULT_SETTINGS.remotePrefixes,
    unserviceable: DEFAULT_SETTINGS.unserviceable,
  },
  showrooms: SHOWROOMS.map((s) => ({ ...s })),
};

// ---------- pages ----------
const s = (page: string, i: number, type: string, data: SectionData = {}): Section => ({ id: `${page || "home"}-${i}-${type}`, type, data: { ...structuredClone(SECTIONS[type].defaults), ...data } });
const page = (slug: string, title: string, seo: PageDoc["seo"], types: [string, SectionData?][], system = true): PageDoc => ({ slug, title, seo, system, sections: types.map(([type, data], i) => s(slug, i, type, data)) });
const header = (eyebrow: string, title: string, intro = "", tone: "light" | "dark" | "image" = "light", image = "") => ["page-header", { eyebrow, title, intro, tone, image }] as [string, SectionData];

const FAQS = [
  { q: "When will my mattress arrive?", a: "<p>Metro cities receive in 3–5 days, the rest of India in 6–9. Enter your pincode on any mattress page for an exact window. Delivery is always complimentary and white-glove.</p>" },
  { q: "Do you take my old mattress away?", a: "<p>Yes, for a small fee we collect your old mattress on the day of delivery and see that it is recycled or donated responsibly.</p>" },
  { q: "Which firmness should I choose?", a: "<p>Side sleepers are usually happiest plush to medium; back sleepers medium to medium-firm; stomach sleepers firmer. Feel each one in our <a href=\"/sleep-studio\">Sleep Studio</a>, or book a free video call and a specialist will guide you.</p>" },
  { q: "Can I pay in instalments?", a: "<p>Yes: no-cost EMI over 3, 6 or 12 months on major credit cards, longer tenures with interest, and pay-later options at checkout.</p>" },
  { q: "How do I care for my mattress?", a: "<p>Rotate it head-to-foot every three months in the first year, then twice a year. Use a protector, and spot-clean with cool water and a mild soap.</p>" },
];

const policy = (slug: string, title: string, body: string): PageDoc =>
  page(`policies/${slug}`, title, { title, description: `${title} at Shakshi.` }, [header("Policies", title), ["rich-text", { body, width: "narrow" }]]);

export const DEFAULT_PAGES: PageDoc[] = [
  page("", "Home", { title: "", description: "" }, [
    ["hero"], ["product-grid"], ["recommended"], ["layers-anatomy"], ["firmness"],
    ["testimonials"], ["press"], ["newsletter"],
  ]),
  page("about", "Our Story", { title: "Our Story · The Thread", description: "The Shakshi story, told as a single gold thread: from one bed stitched by hand in 2012 to the homes we make them for today." }, [["thread-journey"]]),
  page("shop", "Shop", { title: "The Collection", description: "Handcrafted luxury mattresses, from cloud-soft to sculpted and firm. Filter by firmness, size, material and sleeping position." }, [header("The Collection", "Find the one you'll never want to leave.", "Every mattress is handcrafted to order and delivered by our white-glove team."), ["shop-catalog"]]),
  page("showroom", "Showrooms & Contact", { title: "Showrooms & Contact", description: "Visit a Shakshi salon, book a home trial or a free video consultation, or speak with a sleep concierge." }, [header("Showrooms & contact", "Some things must be felt to be believed."), ["showrooms"], ["booking"], ["contact"]]),
  page("sleep-library", "Sleep Library", { title: "The Sleep Library · Essays on Resting Well", description: "Essays from sleep physicians, physiotherapists and our own atelier." }, [header("The Sleep Library", "Slow reading, for deeper nights.", "Essays from sleep physicians, physiotherapists and our own atelier. Read one tonight, an hour before bed."), ["library-index"]]),
  page("sleep-studio", "Sleep Studio", { title: "The Sleep Studio", description: "Feel each mattress yield, calculate bedtimes by sleep cycles, and order free fabric swatches." }, [["sleep-studio-hero"], ["sleep-calculator"], ["swatches"]]),
  page("gift-cards", "Gift Cards", { title: "Gift Cards · The Gift of Deep Sleep", description: "A Shakshi gift card, delivered in a digital envelope." }, [header("Gift cards", "The kindest gift is a good night."), ["gift-builder"]]),
  page("hospitality", "Hospitality & Trade", { title: "Hospitality & Trade · Bulk Mattress Orders", description: "Shakshi mattresses for hotels, serviced apartments, hostels and corporate buyers." }, [
    header("Hospitality & trade", "Give every guest the best night of their trip.", "", "image", "https://images.unsplash.com/photo-1611892440504-42a792e24d32"),
    ["feature-grid", { eyebrow: "For hotels, homes-away-from-home and offices", title: "Guests remember the bed. So do *reviews.*", columns: "2", items: [
      { title: "Trade pricing", body: "Tiered pricing from 20 beds, with transparent landed costs and no surprises at delivery." },
      { title: "Built for the property", body: "Custom sizes, zip-off washable covers, reinforced edges for daily turnover, and fire-safe builds for hotel compliance." },
      { title: "One person to call", body: "A dedicated account manager, sample rooms before you commit, and staggered deliveries around your occupancy." },
      { title: "Installed quietly", body: "Our crews work to your housekeeping schedule, set up every room, and take the old mattresses away for recycling." },
    ] }],
    ["hospitality-form"],
  ]),
  page("setup", "Setup Guide", { title: "Setup Guide · Unboxing Your Mattress", description: "How to unbox and set up your Shakshi mattress, and how long it takes to fully expand." }, [
    header("Setup guide", "Six calm steps to your first night."),
    ["setup-film"],
    ["expansion-timer"],
    ["feature-grid", { eyebrow: "", title: "", columns: "3", tone: "linen", items: [
      { title: "The first week", body: "A faint, natural scent of wool and latex fades within a few days. Keep a window open when you can." },
      { title: "Turn with the seasons", body: "Rotate head-to-foot every three months in the first year, then twice a year." },
      { title: "White-glove customers", body: "If our team delivered and set up your mattress, it arrives already expanded. You can skip straight to sleep." },
    ] }],
  ]),
  page("sleep-society", "Sleep Society", { title: "The Sleep Society · Rewards & Referrals", description: "Earn points on every purchase, review and referral, and rise through three tiers of membership." }, [
    header("The Sleep Society", "Rest well. Be rewarded for it.", "Every Shakshi sleeper is a member. Earn points as you shop, review and share, and rise through three circles of quiet privileges.", "image", "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e"),
    ["society-tiers"],
    ["feature-grid", { eyebrow: "How points gather", title: "Gently, and *all the time.*", columns: "2", tone: "linen", items: [
      { title: "1 point", body: "for every ₹100 you spend" },
      { title: "250 points", body: "for each review you write" },
      { title: "1,000 points", body: "when a friend orders with your link" },
    ] }],
    ["cta", { eyebrow: "Refer a friend", title: "Give ₹5,000. *Get ₹5,000.*", body: "Share your personal link. Your friend takes ₹5,000 off their first mattress, and when they order, you receive the same in Shakshi credit, plus 1,000 points.", ctaText: "Get your link", ctaLink: "/account#rewards", secondaryText: "Send a gift card instead", secondaryLink: "/gift-cards", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0" }],
    ["newsletter", { title: "One quiet letter a month." }],
  ]),
  page("faq", "FAQ", { title: "Questions & Answers", description: "Answers about delivery, firmness, payment, warranty and care." }, [header("Questions", "Everything you might *wonder.*"), ["faq", { eyebrow: "", title: "", items: FAQS }], ["cta", { title: "Still wondering?", body: "Our concierges are awake for you, on WhatsApp, by phone, or on a free video call.", ctaText: "Book a video call", ctaLink: "/showroom?kind=video#book", secondaryText: "Contact us", secondaryLink: "/showroom#contact" }]]),
  policy("warranty", "Warranty", "<p>Every Shakshi mattress carries a 10-year warranty against manufacturing defects, including body impressions deeper than 2.5 cm.</p><h2>What isn't covered</h2><p>Normal softening, stains, burns, damage from an unsuitable base, or use without a protector.</p><p>Register your warranty in your account, or keep your invoice safe.</p>"),
  policy("returns", "Returns & exchanges", "<p>Pillows, protectors and linen can be returned unused within 30 days. For a mattress, please speak with our concierge.</p><p>Gift cards are not refundable but never lose value during their three-year life.</p>"),
  policy("privacy", "Privacy", "<p>We collect only what we need to deliver your order, answer your questions and, if you ask, write to you. We never sell your information.</p><p>Your account and wishlist are kept in your own browser. You can clear them at any time from your account settings.</p><p><em>Please have this page reviewed by your legal adviser before launch.</em></p>"),
  policy("terms", "Terms of sale", "<p>These terms apply to orders placed with Shakshi. Prices include GST. Delivery dates are estimates and we'll always tell you promptly if anything changes.</p><p><em>Please have this page reviewed by your legal adviser before launch.</em></p>"),
];

export const pageKey = (slug: string) => slug || "home";
export const findDefaultPage = (slug: string) => DEFAULT_PAGES.find((p) => p.slug === slug);
