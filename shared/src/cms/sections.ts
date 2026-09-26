import type { Field, SectionData } from "./types";

export type SectionDef = {
  label: string;
  description: string;
  group: "Heroes & headers" | "Story" | "Products" | "Trust" | "Tools" | "Engagement" | "Text";
  fields: Field[];
  defaults: SectionData;
  /** Only one per page, and the studio won't offer it in the library for other pages. */
  unique?: boolean;
};

// ---- small field builders ----
const t = (key: string, label: string, help?: string): Field => ({ key, label, type: "text", help });
const ta = (key: string, label: string, help?: string): Field => ({ key, label, type: "textarea", help });
const rt = (key: string, label: string): Field => ({ key, label, type: "richtext" });
const img = (key: string, label: string): Field => ({ key, label, type: "image" });
const link = (key: string, label: string): Field => ({ key, label, type: "link" });
const num = (key: string, label: string, min?: number, max?: number): Field => ({ key, label, type: "number", min, max });
const sel = (key: string, label: string, options: [string, string][]): Field => ({ key, label, type: "select", options: options.map(([value, l]) => ({ value, label: l })) });
const list = (key: string, label: string, itemLabel: string, of: Field[]): Field => ({ key, label, type: "list", itemLabel, of });
const EM = "Wrap words in *asterisks* for an italic accent.";

const heading = [t("eyebrow", "Eyebrow"), t("title", "Title", EM)];
const cta = [t("ctaText", "Button text"), link("ctaLink", "Button link")];

export const ICONS: [string, string][] = [
  ["hand", "Hand (handcrafted)"],
  ["moon", "Moon (trial)"],
  ["shield", "Shield (warranty)"],
  ["truck", "Truck (delivery)"],
  ["leaf", "Leaf (eco)"],
  ["sparkle", "Sparkle"],
  ["bed", "Bed"],
  ["clock", "Clock"],
  ["gift", "Gift"],
];

export const SECTIONS: Record<string, SectionDef> = {
  hero: {
    label: "Hero",
    description: "Full-screen opening with headline, day and night versions, and a call to action.",
    group: "Heroes & headers",
    unique: true,
    fields: [
      sel("media", "Background", [["3d", "3D bed with falling duvet"], ["image", "Image"], ["video", "Video"]]),
      img("image", "Background image"),
      { key: "video", label: "Background video", type: "video" },
      t("eyebrow", "Eyebrow"),
      ta("headline", "Headline", "One line per row. The last row is set in italic gold."),
      ta("body", "Text"),
      t("nightEyebrow", "Night eyebrow (after 7pm)"),
      ta("nightHeadline", "Night headline"),
      ta("nightBody", "Night text"),
      ...cta,
      t("secondaryText", "Secondary link text"),
      link("secondaryLink", "Secondary link"),
    ],
    defaults: {
      media: "3d",
      image: "",
      video: "",
      eyebrow: "A commitment for complete rest",
      headline: "Sleep,\nElevated.",
      body: "Fall into something extraordinary. Mattresses shaped by hand, layered with the world’s gentlest materials, made for the deepest kind of rest.",
      nightEyebrow: "Good evening",
      nightHeadline: "Ready for\ntonight?",
      nightBody: "The lights are low and the day is done. Find the mattress that will hold you through every hour of it, until a slow and restored morning.",
      ctaText: "Find Your Mattress",
      ctaLink: "/quiz",
      secondaryText: "Explore the collection",
      secondaryLink: "/shop",
    },
  },
  "page-header": {
    label: "Page header",
    description: "Title block at the top of a page, light or dark, with an optional image.",
    group: "Heroes & headers",
    fields: [...heading, ta("intro", "Intro"), sel("tone", "Style", [["light", "Light"], ["dark", "Dark"], ["image", "Dark over image"]]), img("image", "Image (for 'over image')")],
    defaults: { eyebrow: "Eyebrow", title: "A calm, confident *headline.*", intro: "", tone: "light", image: "" },
  },
  "product-grid": {
    label: "Product grid",
    description: "A row of mattress cards with hover details.",
    group: "Products",
    fields: [...heading, ta("intro", "Intro"), { key: "products", label: "Mattresses", type: "products" }, t("linkText", "Link text"), link("linkHref", "Link")],
    defaults: { eyebrow: "The Collection", title: "Four ways to *drift away.*", intro: "From cloud-soft to sculpted and firm, each one handcrafted, each one unhurried.", products: ["cirrus", "signature", "atelier", "sovereign"], linkText: "View all mattresses", linkHref: "/shop" },
  },
  recommended: {
    label: "Recommended for you",
    description: "Personal picks from the visitor's quiz, wishlist and browsing. Hidden until we know something about them.",
    group: "Products",
    fields: [t("title", "Title"), t("fallbackTitle", "Title when there's nothing personal yet (leave blank to hide)")],
    defaults: { title: "Recommended for you", fallbackTitle: "" },
  },
  "layers-anatomy": {
    label: "Anatomy of comfort",
    description: "Scroll-pinned sequence of the mattress separating into its layers.",
    group: "Story",
    unique: true,
    fields: [
      t("heading", "Opening heading"),
      t("finale", "Closing heading"),
      ...cta,
      list("layers", "Layers (top to bottom)", "name", [t("name", "Name"), t("benefit", "Benefit"), t("spec", "Spec"), img("texture", "Material close-up")]),
      t("framesDesktop", "Frame sequence (desktop)", "URL pattern with {i}, e.g. /anatomy/d/{i}.webp"),
      num("framesDesktopCount", "Desktop frame count", 1, 400),
      t("framesMobile", "Frame sequence (mobile)"),
      num("framesMobileCount", "Mobile frame count", 1, 400),
      { key: "model", label: "3D model (GLB) fallback", type: "file" },
    ],
    defaults: {
      heading: "What lies within.",
      finale: "Engineered to hold you.",
      ctaText: "Find your mattress",
      ctaLink: "/quiz",
      layers: [
        { name: "Wool-quilted cover", benefit: "Breathable, temperature-balancing touch", spec: "3 cm New Zealand wool & organic cotton", texture: "" },
        { name: "Cooling gel layer", benefit: "Draws heat away, all night", spec: "3 cm phase-change gel foam", texture: "" },
        { name: "Contour foam", benefit: "Cradles every curve", spec: "5 cm adaptive memory foam", texture: "" },
        { name: "Zoned spring core", benefit: "Firmer at the hips, softer at the shoulders", spec: "18 cm, 7-zone pocket coils", texture: "" },
        { name: "Foundation", benefit: "Full-surface, lasting support", spec: "3 cm reinforced edge base", texture: "" },
      ],
      framesDesktop: "/anatomy/desktop/{i}.webp",
      framesDesktopCount: 150,
      framesMobile: "/anatomy/mobile/{i}.webp",
      framesMobileCount: 72,
      model: "",
    },
  },
  "feature-strip": {
    label: "Feature strip",
    description: "A row of promises with fine-line icons.",
    group: "Trust",
    fields: [t("eyebrow", "Eyebrow"), list("items", "Features", "title", [sel("icon", "Icon", ICONS), t("title", "Title"), ta("body", "Text")])],
    defaults: {
      eyebrow: "Why Shakshi",
      items: [
        { icon: "hand", title: "Handcrafted", body: "Hand-tufted and finished by our artisans, never rushed." },
        { icon: "moon", title: "100-night trial", body: "Sleep on it for a season. Return it freely if it isn't right." },
        { icon: "shield", title: "10-year warranty", body: "Built to hold its shape for a decade of nights." },
        { icon: "truck", title: "White-glove delivery", body: "Complimentary, set up in your room, packaging taken away." },
        { icon: "leaf", title: "Eco-certified", body: "Organic cotton, natural latex and responsibly sourced wool." },
      ],
    },
  },
  comparison: {
    label: "Comparison table",
    description: "Shakshi side by side with two alternatives. Use 'yes' or 'no' for ticks and dashes.",
    group: "Trust",
    fields: [...heading, t("brandLabel", "Our column"), t("colA", "Second column"), t("colB", "Third column"), list("rows", "Rows", "label", [t("label", "Row"), t("ours", "Shakshi"), t("a", "Second column"), t("b", "Third column")])],
    defaults: {
      eyebrow: "The difference",
      title: "Not all mattresses are *made alike.*",
      brandLabel: "Shakshi",
      colA: "Typical store mattress",
      colB: "Typical online mattress",
      rows: [
        { label: "Handcrafted to order", ours: "yes", a: "no", b: "no" },
        { label: "Try it at home", ours: "100 nights", a: "no", b: "Often 30–100 nights" },
        { label: "Feel it before buying", ours: "Salons, home trials & video calls", a: "yes", b: "no" },
        { label: "Delivery", ours: "White-glove, set up in your room", a: "Kerbside, often charged", b: "Rolled in a box" },
        { label: "Natural materials", ours: "Wool, organic cotton, natural latex", a: "Varies", b: "Mostly synthetic foams" },
        { label: "Warranty", ours: "10 years", a: "1–5 years", b: "Varies" },
        { label: "Old mattress taken away", ours: "yes", a: "Sometimes", b: "no" },
        { label: "Clear, fixed pricing", ours: "yes", a: "Negotiated", b: "yes" },
      ],
    },
  },
  certifications: {
    label: "Certifications",
    description: "Badges that open a short explanation of each certificate.",
    group: "Trust",
    fields: [t("eyebrow", "Eyebrow"), list("items", "Certificates", "name", [t("mark", "Seal letters"), t("name", "Name"), t("scope", "What it covers"), ta("body", "Explanation")])],
    defaults: {
      eyebrow: "Certified, thread by thread",
      items: [
        { mark: "CP", name: "CertiPUR-US®", scope: "Foams", body: "Our foams are made without ozone depleters, PBDE flame retardants, mercury, lead or formaldehyde, and are tested for low emissions (VOCs) for indoor air quality." },
        { mark: "OT", name: "OEKO-TEX® Standard 100", scope: "Covers & textiles", body: "Every thread, button and zip that touches you is tested for harmful substances, to the strictest class for products in direct contact with skin." },
        { mark: "GO", name: "GOTS", scope: "Organic cotton", body: "The Global Organic Textile Standard certifies our cotton from field to finished cover: organic fibre, and responsible processing all the way through." },
        { mark: "GL", name: "GOLS", scope: "Natural latex", body: "The Global Organic Latex Standard confirms our latex is made from certified organic rubber, with strict limits on fillers and chemicals." },
        { mark: "ISO", name: "ISO 9001", scope: "Our atelier", body: "Our workshop's quality management is independently audited, so every mattress is built, checked and finished the same careful way." },
      ],
    },
  },
  firmness: {
    label: "Firmness simulator",
    description: "Press-and-hold mattress that shows how deeply each model yields.",
    group: "Tools",
    fields: [...heading, ta("intro", "Intro"), t("linkText", "Link text"), link("linkHref", "Link"), sel("tone", "Style", [["light", "Light"], ["dark", "Dark"]])],
    defaults: { eyebrow: "Feel it from here", title: "Press gently. *Sink slowly.*", intro: "Every Shakshi yields differently. Press and hold the mattress to feel how deeply each one welcomes you, and how it rises to meet you again.", linkText: "Visit the Sleep Studio", linkHref: "/sleep-studio", tone: "light" },
  },
  "text-image": {
    label: "Text and image",
    description: "Editorial block: large image with a smaller detail image, and text beside it.",
    group: "Story",
    fields: [...heading, ta("body", "Text"), img("image", "Main image"), t("imageAlt", "Main image alt text"), img("detail", "Detail image"), ...cta, sel("imageSide", "Image side", [["left", "Left"], ["right", "Right"]]), sel("tone", "Style", [["light", "Light"], ["dark", "Dark"]])],
    defaults: { eyebrow: "The Atelier", title: "Twelve hours of patience, in every mattress.", body: "In our workshop outside Bengaluru, each Shakshi is tufted by hand, its wool layered in the old way, its edges stitched until they are perfect. We make fewer mattresses, so that each one can be extraordinary.", image: "https://images.unsplash.com/photo-1606722590583-6951b5ea92ad", imageAlt: "An artisan's hands at work in the Shakshi atelier", detail: "https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5", ctaText: "Discover our craft", ctaLink: "/about", imageSide: "left", tone: "light" },
  },
  "feature-grid": {
    label: "Feature grid",
    description: "Numbered points in two or three columns.",
    group: "Text",
    fields: [...heading, sel("columns", "Columns", [["2", "Two"], ["3", "Three"]]), list("items", "Points", "title", [t("title", "Title"), ta("body", "Text")]), sel("tone", "Style", [["light", "Light"], ["linen", "Linen"], ["dark", "Dark"]])],
    defaults: { eyebrow: "", title: "", columns: "3", items: [{ title: "A point", body: "Something worth knowing." }], tone: "light" },
  },
  stats: {
    label: "Numbers",
    description: "A band of large figures with short captions.",
    group: "Story",
    fields: [list("items", "Figures", "label", [t("value", "Figure"), t("label", "Caption")]), sel("tone", "Style", [["dark", "Dark"], ["light", "Light"]])],
    defaults: { items: [{ value: "92%", label: "Natural or recycled materials" }, { value: "12 hrs", label: "Of handwork in every mattress" }, { value: "40,000+", label: "Native trees planted" }], tone: "dark" },
  },
  testimonials: {
    label: "Testimonials",
    description: "Carousel of sleepers with photos, ratings and sleep-score changes.",
    group: "Trust",
    fields: [
      t("eyebrow", "Eyebrow"),
      list("items", "Testimonials", "name", [t("name", "Name"), t("city", "City"), img("image", "Portrait"), t("product", "Mattress"), ta("quote", "Quote"), num("rating", "Stars", 1, 5), num("before", "Sleep score before", 0, 100), num("after", "Sleep score after", 0, 100)]),
    ],
    defaults: { eyebrow: "Sleepers, in their own words", items: [] },
  },
  press: {
    label: "Press & awards",
    description: "A slow marquee of publications, with awards beneath.",
    group: "Trust",
    fields: [t("eyebrow", "Eyebrow"), list("items", "Publications", "name", [t("name", "Name"), t("quote", "Quote"), img("logo", "Logo (optional)")]), list("awards", "Awards", "text", [t("text", "Award")])],
    defaults: {
      eyebrow: "As featured in",
      items: [
        { name: "MAISON JOURNAL", quote: "The most beautiful bed we've slept in this year.", logo: "" },
        { name: "The Quiet Review", quote: "Quiet luxury, made literal.", logo: "" },
        { name: "SLEEP & DESIGN", quote: "A new standard for the Indian bedroom.", logo: "" },
        { name: "Lumière", quote: "Hotel-suite comfort, at home.", logo: "" },
        { name: "ATELIER POST", quote: "Craftsmanship you can feel.", logo: "" },
      ],
      awards: [{ text: "Design of the Year 2026" }, { text: "GOTS & GOLS certified" }, { text: "CertiPUR® foams" }],
    },
  },
  "real-bedrooms": {
    label: "Real bedrooms",
    description: "Shoppable customer photos (edit the photos in Settings → Real bedrooms).",
    group: "Engagement",
    fields: [...heading, t("linkText", "Link text"), link("linkHref", "Link"), num("limit", "How many (0 = all, with filters)", 0, 30)],
    defaults: { eyebrow: "Real bedrooms", title: "Where our mattresses *live now.*", linkText: "See every room", linkHref: "/real-bedrooms", limit: 3 },
  },
  tools: {
    label: "Tool cards",
    description: "Image cards linking to the quiz, configurator and other tools.",
    group: "Engagement",
    fields: [...heading, list("items", "Cards", "title", [sel("icon", "Icon", ICONS), t("title", "Title"), ta("body", "Text"), img("image", "Image"), link("href", "Link")])],
    defaults: {
      eyebrow: "Personal guidance",
      title: "Let us *tailor* your rest.",
      items: [
        { icon: "sparkle", title: "The Sleep Quiz", body: "Seven gentle questions. One mattress, matched to you.", image: "https://images.unsplash.com/photo-1520206183501-b80df61043c2", href: "/quiz" },
        { icon: "bed", title: "Build Your Bed", body: "Compose mattress, cover, pillows and frame, and watch it come alive.", image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0", href: "/build-your-bed" },
        { icon: "clock", title: "Sleep Calculator", body: "Wake between cycles, never in the middle of a dream.", image: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d", href: "/sleep-studio#calculator" },
      ],
    },
  },
  "library-teaser": {
    label: "Sleep Library essays",
    description: "The latest essays from the Sleep Library.",
    group: "Engagement",
    fields: [...heading, t("linkText", "Link text"), num("count", "How many", 1, 9)],
    defaults: { eyebrow: "The Sleep Library", title: "Read one tonight, *an hour before bed.*", linkText: "All essays", count: 3 },
  },
  newsletter: {
    label: "Newsletter signup",
    description: "Sleep Society signup over a night-sky image.",
    group: "Engagement",
    fields: [...heading, ta("body", "Text"), t("footnote", "Small print"), img("image", "Background image")],
    defaults: { eyebrow: "The Sleep Society", title: "Join the Sleep Society.", body: "Rituals for better nights, first access to limited editions, and invitations to our salons. As a welcome, a complimentary Silk Protector with your first mattress.", footnote: "One quiet letter a month. Unsubscribe whenever you wish.", image: "https://images.unsplash.com/photo-1475274047050-1d0c0975c63e" },
  },
  "thread-journey": {
    label: "The Thread (brand journey)",
    description: "The brand story as a gold thread that draws itself through each chapter.",
    group: "Story",
    unique: true,
    fields: [
      t("intro", "Opening line", EM),
      t("hint", "Scroll hint"),
      list("chapters", "Chapters", "title", [t("year", "Year"), t("label", "Label (optional, e.g. 'Next')"), t("title", "Title"), ta("lines", "Story (one line per row)"), img("image", "Image"), t("alt", "Image alt text")]),
      t("closing", "Closing line", EM),
      ...cta,
    ],
    defaults: {
      intro: "Every great night begins with a *single stitch.*",
      hint: "Follow the thread",
      chapters: [
        { year: "2012", label: "", title: "The Beginning", lines: "It began with one bed, stitched by hand\nfor our own family, in a small room in Bengaluru.\nIt took eleven days. We have never hurried since.", image: "https://images.unsplash.com/photo-1515894203077-9cd36032142f", alt: "Someone asleep in soft white linen" },
        { year: "2014", label: "", title: "The First Workshop", lines: "A rented workshop among coconut groves,\nfour craftspeople, and a long wooden table\nwhere every mattress was tufted, tied and signed.", image: "https://images.unsplash.com/photo-1606722590583-6951b5ea92ad", alt: "An artisan's hands at a workbench" },
        { year: "2016", label: "", title: "The Material Search", lines: "We went looking for the softest things on earth:\nwool from the hills, latex from Kerala's rubber trees,\ncotton grown without a single shortcut.", image: "https://images.unsplash.com/photo-1484557985045-edf25e08da73", alt: "A flock of woolly sheep in a meadow" },
        { year: "2019", label: "", title: "The First Bed", lines: "The first Shakshi collection left the workshop.\nFamilies wrote to tell us they slept through the night.\nWe kept every letter.", image: "https://images.unsplash.com/photo-1582582621959-48d27397dc69", alt: "A tufted headboard above crisp bedding" },
        { year: "2024", label: "", title: "Today", lines: "Forty hands, twelve hours for every mattress,\nand homes across India that rest a little deeper.\nThe table is longer now. The care is the same.", image: "https://images.unsplash.com/photo-1590490360182-c33d57733427", alt: "A calm suite in evening light" },
        { year: "2030", label: "Next", title: "What's Next", lines: "Beds that give back more than they take:\nfully recyclable, repaired rather than replaced,\nand made to be handed down.", image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e", alt: "Light falling through a quiet forest" },
      ],
      closing: "The thread continues *with you.*",
      ctaText: "Find Your Mattress",
      ctaLink: "/quiz",
    },
  },
  faq: {
    label: "FAQ",
    description: "Questions and answers in an accessible accordion (also marked up for search engines).",
    group: "Text",
    fields: [...heading, list("items", "Questions", "q", [t("q", "Question"), rt("a", "Answer")])],
    defaults: { eyebrow: "Questions", title: "Everything you might *wonder.*", items: [] },
  },
  "rich-text": {
    label: "Rich text",
    description: "Formatted long-form text: policies, stories, anything.",
    group: "Text",
    fields: [...heading, rt("body", "Text"), sel("width", "Width", [["narrow", "Narrow (reading)"], ["wide", "Wide"]])],
    defaults: { eyebrow: "", title: "", body: "<p>Write something calm and clear.</p>", width: "narrow" },
  },
  cta: {
    label: "Call to action",
    description: "A closing invitation with one or two buttons.",
    group: "Engagement",
    fields: [...heading, ta("body", "Text"), ...cta, t("secondaryText", "Second button text"), link("secondaryLink", "Second button link"), img("image", "Image (optional)"), sel("tone", "Style", [["light", "Light"], ["dark", "Dark"]])],
    defaults: { eyebrow: "", title: "Come and feel the *difference.*", body: "Our salons are quiet, unhurried spaces. Lie down, stay as long as you like, and let our sleep specialists guide you.", ctaText: "Book a private visit", ctaLink: "/showroom", secondaryText: "Explore mattresses", secondaryLink: "/shop", image: "", tone: "light" },
  },
  // ---- tools: the interactive parts of built-in pages, with their surrounding words editable ----
  "shop-catalog": { label: "Shop catalogue", description: "Filterable mattress grid with compare and quick view.", group: "Tools", unique: true, fields: [], defaults: {} },
  quiz: { label: "Sleep Quiz", description: "The seven-step mattress matchmaker (questions are edited in Quiz).", group: "Tools", unique: true, fields: [t("eyebrow", "Eyebrow")], defaults: { eyebrow: "The Sleep Quiz" } },
  configurator: { label: "Bed configurator", description: "Build Your Bed, with live 3D preview.", group: "Tools", unique: true, fields: [], defaults: {} },
  "sleep-calculator": { label: "Sleep calculator", description: "Bedtimes by 90-minute cycles.", group: "Tools", fields: [...heading, ta("intro", "Intro"), img("image", "Image")], defaults: { eyebrow: "Sleep calculator", title: "Wake between *dreams.*", intro: "Sleep moves in gentle 90-minute cycles. Waking at the end of one, rather than in the middle, is the difference between groggy and restored.", image: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d" } },
  swatches: { label: "Swatch request", description: "Free fabric swatch form.", group: "Tools", fields: [...heading, ta("intro", "Intro"), img("image", "Image")], defaults: { eyebrow: "Complimentary", title: "Touch the *fabric* first.", intro: "We'll post you up to three swatches of our covers, so you can feel the weave and see the colour in your own light. Always free.", image: "https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5" } },
  showrooms: { label: "Showroom locations", description: "Salon map and details (edit locations in Settings → Showrooms).", group: "Tools", fields: [], defaults: {} },
  booking: { label: "Booking", description: "Salon visits, home trials and video consultations.", group: "Tools", fields: [...heading, ta("intro", "Intro")], defaults: { eyebrow: "Reserve", title: "A private *visit*, a home trial, or a call.", intro: "An unhurried hour in a salon, a specialist in your own bedroom, or fifteen free minutes on video. Whichever feels easiest." } },
  contact: { label: "Contact", description: "WhatsApp, phone, email and a message form.", group: "Tools", fields: [...heading], defaults: { eyebrow: "Contact", title: "We’re always *awake* for you." } },
  "library-index": { label: "Sleep Library index", description: "All essays with topic filters.", group: "Tools", unique: true, fields: [], defaults: {} },
  "gift-builder": { label: "Gift card builder", description: "Choose amount and envelope, with a live preview.", group: "Tools", unique: true, fields: [], defaults: {} },
  "hospitality-form": { label: "Trade enquiry form", description: "Bulk and hospitality enquiries.", group: "Tools", fields: [...heading, ta("intro", "Intro"), img("image", "Image")], defaults: { eyebrow: "Enquire", title: "Tell us about your property.", intro: "We’ll reply within a working day with pricing, lead times and an offer to send a sample room.", image: "https://images.unsplash.com/photo-1631049035182-249067d7618e" } },
  "setup-film": { label: "Unboxing film", description: "Illustrated setup steps, or your own video (set in the Anatomy of the page).", group: "Tools", fields: [{ key: "video", label: "Video (optional)", type: "video" }], defaults: { video: "" } },
  "expansion-timer": { label: "Expansion countdown", description: "24-hour 'your mattress is expanding' timer.", group: "Tools", fields: [...heading], defaults: { eyebrow: "The first 24 hours", title: "Your mattress is *expanding.*" } },
  "society-tiers": { label: "Membership tiers", description: "The three Sleep Society tiers and their perks.", group: "Engagement", fields: [], defaults: {} },
  "sleep-studio-hero": { label: "Sleep Studio opening", description: "Dark opening with the firmness simulator.", group: "Tools", unique: true, fields: [...heading, ta("intro", "Intro")], defaults: { eyebrow: "The Sleep Studio", title: "Feel it before it arrives.", intro: "Press and hold the mattress. Watch the layers yield beneath your hand, then notice how each one returns: slowly and tenderly, or with a buoyant lift." } },
};

export const sectionDefaults = (type: string): SectionData => structuredClone(SECTIONS[type]?.defaults ?? {});
