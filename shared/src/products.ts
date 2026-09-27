import { IMG } from "./images";

export type SizeId = "single" | "double" | "queen" | "king" | "superking";
export type Position = "side" | "back" | "stomach" | "combination";
export type Material = "memory-foam" | "latex" | "pocket-springs" | "cooling-gel" | "wool";

export const SIZES: { id: SizeId; label: string; dims: string; cm: [number, number]; factor: number }[] = [
  { id: "single", label: "Single", dims: "91 × 190 cm", cm: [91, 190], factor: 0.6 },
  { id: "double", label: "Double", dims: "137 × 190 cm", cm: [137, 190], factor: 0.82 },
  { id: "queen", label: "Queen", dims: "152 × 198 cm", cm: [152, 198], factor: 1 },
  { id: "king", label: "King", dims: "183 × 198 cm", cm: [183, 198], factor: 1.18 },
  { id: "superking", label: "Super King", dims: "198 × 213 cm", cm: [198, 213], factor: 1.34 },
];

export type Layer = { name: string; material: string; benefit: string; depth: number };

export type Product = {
  slug: string;
  name: string;
  tier: string;
  tagline: string;
  feeling: string;
  description: string;
  firmness: number; // 1 plush → 10 firm
  firmnessLabel: string;
  height: number; // cm
  basePrice: number; // queen, INR
  images: string[];
  materials: Material[];
  positions: Position[];
  cooling: number; // 1-5
  motionIsolation: number; // 1-5
  edgeSupport: number; // 1-5
  highlights: string[];
  layers: Layer[];
  sink: number; // max sink depth in cm under a palm press
  recovery: number; // seconds for foam to return
  rating: number;
  reviewCount: number;
  badge?: string;
  /** Set in the studio: exact price per size (otherwise derived from the Queen price). */
  prices?: Partial<Record<SizeId, number>>;
  /** Hidden from the shop when false. */
  published?: boolean;
  /** Slug of the product category it is listed under (Site & theme, Product categories). */
  category?: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "cirrus",
    category: "plush",
    name: "The Cirrus",
    tier: "Plush",
    tagline: "Weightless, like sleeping on a held breath.",
    feeling: "Cocooned",
    description:
      "Our softest expression. Three whispering layers of adaptive foam draw you gently in, easing shoulders and hips, while a hidden spring core keeps you effortlessly aligned.",
    firmness: 3,
    firmnessLabel: "Plush",
    height: 30,
    basePrice: 64900,
    images: [IMG.whiteLux, IMG.tufted, IMG.cushion, IMG.linen],
    materials: ["memory-foam", "pocket-springs", "cooling-gel"],
    positions: ["side", "combination"],
    cooling: 3,
    motionIsolation: 5,
    edgeSupport: 3,
    highlights: ["Pressure-relieving for side sleepers", "Deep motion isolation", "Cloud-knit cotton cover"],
    layers: [
      { name: "Cloud-knit cover", material: "Organic cotton & Tencel™", benefit: "Silken, breathable touch", depth: 2 },
      { name: "Cooling gel veil", material: "Graphite-infused gel foam", benefit: "Draws heat away", depth: 3 },
      { name: "Adaptive comfort", material: "Open-cell memory foam", benefit: "Slow, cradling sink", depth: 7 },
      { name: "Pocket-spring core", material: "1,024 individually wrapped coils", benefit: "Buoyant alignment", depth: 15 },
      { name: "Foundation", material: "High-density plant-based foam", benefit: "Enduring stability", depth: 3 },
    ],
    sink: 6.2,
    recovery: 1.6,
    rating: 4.9,
    reviewCount: 1284,
    badge: "Most Loved",
  },
  {
    slug: "signature",
    category: "balanced",
    name: "The Shakshi Signature",
    tier: "Balanced",
    tagline: "The perfect middle of the night.",
    feeling: "Restored",
    description:
      "Our house mattress, refined over a decade. Contouring foam over a zoned spring system gives the rare feeling of being held and lifted at once.",
    firmness: 6,
    firmnessLabel: "Medium",
    height: 32,
    basePrice: 89900,
    images: [IMG.suiteWarm, IMG.elegant, IMG.linen, IMG.cushion],
    materials: ["memory-foam", "pocket-springs", "cooling-gel", "wool"],
    positions: ["side", "back", "combination"],
    cooling: 4,
    motionIsolation: 4,
    edgeSupport: 4,
    highlights: ["Seven-zone spinal support", "Hand-tufted New Zealand wool", "Ideal for couples"],
    layers: [
      { name: "Wool-quilted cover", material: "New Zealand wool & organic cotton", benefit: "Temperature-balancing", depth: 3 },
      { name: "Cooling gel layer", material: "Phase-change gel foam", benefit: "Cool to the touch, all night", depth: 3 },
      { name: "Contour foam", material: "Adaptive memory foam", benefit: "Cradles every curve", depth: 5 },
      { name: "Zoned spring core", material: "7-zone micro & pocket coils", benefit: "Firmer at the hips, softer at shoulders", depth: 18 },
      { name: "Foundation", material: "Reinforced edge base", benefit: "Full-surface support", depth: 3 },
    ],
    sink: 4.4,
    recovery: 1.1,
    rating: 4.9,
    reviewCount: 2107,
    badge: "Signature",
  },
  {
    slug: "lumen",
    category: "balanced",
    name: "The Lumen",
    tier: "Cool",
    tagline: "A cool sheet on a summer night, always.",
    feeling: "Refreshed",
    description:
      "Designed for warm sleepers and warmer climates. An open latex lattice and cooling gel breathe continuously, so the bed stays as cool at 4am as it was at midnight.",
    firmness: 5,
    firmnessLabel: "Medium-Plush",
    height: 28,
    basePrice: 74900,
    images: [IMG.brightRoom, IMG.hotel, IMG.linen, IMG.pillowWhite],
    materials: ["latex", "cooling-gel", "pocket-springs"],
    positions: ["back", "side", "combination"],
    cooling: 5,
    motionIsolation: 4,
    edgeSupport: 3,
    highlights: ["Up to 3°C cooler surface", "Ventilated Talalay latex", "Responsive, never stuck"],
    layers: [
      { name: "Arctic weave cover", material: "Cool-touch Tencel™ & linen", benefit: "Instantly cool", depth: 2 },
      { name: "Cooling gel", material: "Phase-change gel foam", benefit: "Absorbs excess heat", depth: 4 },
      { name: "Ventilated latex", material: "Talalay natural latex", benefit: "Buoyant & breathable", depth: 6 },
      { name: "Pocket-spring core", material: "Airflow coil system", benefit: "Constant circulation", depth: 13 },
      { name: "Foundation", material: "Perforated base foam", benefit: "Breathes from below", depth: 3 },
    ],
    sink: 5.1,
    recovery: 0.6,
    rating: 4.8,
    reviewCount: 842,
  },
  {
    slug: "atelier",
    category: "firm",
    name: "The Atelier",
    tier: "Natural",
    tagline: "Pure materials, patiently made.",
    feeling: "Grounded",
    description:
      "Hand-finished in our workshop from organic latex, wool and cotton, with no synthetic foams at all. A buoyant, gently firm feel that rewards the back sleeper.",
    firmness: 7,
    firmnessLabel: "Medium-Firm",
    height: 30,
    basePrice: 124900,
    images: [IMG.platform, IMG.minimal, IMG.rail, IMG.sheep],
    materials: ["latex", "wool", "pocket-springs"],
    positions: ["back", "stomach", "combination"],
    cooling: 4,
    motionIsolation: 3,
    edgeSupport: 4,
    highlights: ["GOLS-certified organic latex", "Hand-tufted, 12 hours of work", "Naturally hypoallergenic"],
    layers: [
      { name: "Hand-tufted cover", material: "GOTS organic cotton", benefit: "Soft, natural, breathable", depth: 2 },
      { name: "Wool comfort", material: "Ethically-sourced Merino", benefit: "Wicks moisture, regulates warmth", depth: 3 },
      { name: "Organic latex", material: "Dunlop natural latex", benefit: "Buoyant, springy support", depth: 7 },
      { name: "Pocket-spring core", material: "Recycled-steel coils", benefit: "Firm, lifted alignment", depth: 15 },
      { name: "Foundation", material: "Coconut coir & jute", benefit: "Breathable, plastic-free", depth: 3 },
    ],
    sink: 3.2,
    recovery: 0.4,
    rating: 4.8,
    reviewCount: 516,
    badge: "Eco-Certified",
  },
  {
    slug: "sovereign",
    category: "firm",
    name: "The Sovereign",
    tier: "Luxe Firm",
    tagline: "Our most indulgent creation.",
    feeling: "Held",
    description:
      "A double-spring hybrid crowned with cashmere and silk. Firm, sculpted support beneath a pillow-top so luxurious it feels poured rather than built.",
    firmness: 8,
    firmnessLabel: "Luxe Firm",
    height: 36,
    basePrice: 169900,
    images: [IMG.grandSuite, IMG.suiteDusk, IMG.cushion, IMG.linen],
    materials: ["pocket-springs", "memory-foam", "wool", "latex"],
    positions: ["back", "stomach"],
    cooling: 4,
    motionIsolation: 4,
    edgeSupport: 5,
    highlights: ["Cashmere & silk pillow-top", "Dual-tier 2,400-coil system", "Reinforced perimeter edge"],
    layers: [
      { name: "Cashmere pillow-top", material: "Cashmere, silk & wool", benefit: "A plush, poured first touch", depth: 5 },
      { name: "Cooling gel", material: "Graphite gel foam", benefit: "Stays temperate", depth: 3 },
      { name: "Latex transition", material: "Talalay latex", benefit: "Responsive lift", depth: 4 },
      { name: "Dual spring system", material: "Micro coils over pocket coils", benefit: "Sculpted, firm support", depth: 20 },
      { name: "Foundation", material: "Reinforced steel-edge base", benefit: "Uncompromising stability", depth: 4 },
    ],
    sink: 2.6,
    recovery: 0.8,
    rating: 5.0,
    reviewCount: 398,
    badge: "Flagship",
  },
];

export const FEATURED = ["cirrus", "signature", "atelier", "sovereign"];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

export const priceFor = (p: Pick<Product, "basePrice" | "prices">, size: SizeId) => {
  const exact = p.prices?.[size];
  if (typeof exact === "number" && exact > 0) return exact;
  const f = SIZES.find((s) => s.id === size)?.factor ?? 1;
  return Math.round((p.basePrice * f) / 100) * 100;
};

export const MATERIAL_LABELS: Record<Material, string> = {
  "memory-foam": "Memory foam",
  latex: "Natural latex",
  "pocket-springs": "Pocket springs",
  "cooling-gel": "Cooling gel",
  wool: "Wool",
};

export const POSITION_LABELS: Record<Position, string> = {
  side: "Side",
  back: "Back",
  stomach: "Stomach",
  combination: "Combination",
};

// Add-ons & accessories
export type Accessory = { id: string; name: string; price: number; image: string; note: string };

export const ACCESSORIES: Accessory[] = [
  { id: "pillows", name: "Cloud Pillow, pair", price: 8900, image: IMG.pillowWhite, note: "Down-alternative, adjustable loft" },
  { id: "protector", name: "Silk Mattress Protector", price: 6400, image: IMG.linen, note: "Waterproof, silent, breathable" },
  { id: "sheets", name: "Stonewashed Linen Set", price: 12900, image: IMG.pillowsBed, note: "Belgian flax, 4 pieces" },
];

export const ADDONS = [
  { id: "pillows", name: "Cloud Pillows (pair)", price: 8900, note: "Adjustable loft, hotel-grade" },
  { id: "protector", name: "Silk Protector", price: 6400, note: "Waterproof & whisper-quiet" },
  { id: "frame", name: "Aurelia Bed Frame", price: 58000, note: "Upholstered, solid oak base" },
  { id: "removal", name: "Old-Mattress Removal", price: 1500, note: "Responsibly recycled" },
] as const;

export type AddonId = (typeof ADDONS)[number]["id"];

// Cover fabrics (offered as free swatches)
export const COVERS = [
  { id: "ivory", name: "Ivory", hex: "#efe8dc" },
  { id: "oat", name: "Oat", hex: "#d6c6ad" },
  { id: "taupe", name: "Taupe", hex: "#a89f94" },
  { id: "blush", name: "Blush", hex: "#e6c7bd" },
  { id: "midnight", name: "Midnight", hex: "#2a3246" },
];

export const FREE_GIFT_THRESHOLD = 100000;

// Testimonials
export const TESTIMONIALS = [
  {
    name: "Ananya Mehra",
    city: "Mumbai",
    image: IMG.p1,
    product: "The Cirrus",
    quote: "The first night I simply disappeared. I've never slept through a monsoon storm before, and now I barely remember the nights.",
    rating: 5,
    before: 68,
    after: 91,
  },
  {
    name: "Karan Oberoi",
    city: "New Delhi",
    image: IMG.p2,
    product: "The Sovereign",
    quote: "It feels like the best suite I've ever stayed in, except it's mine. My lower back pain stopped being part of my mornings.",
    rating: 5,
    before: 62,
    after: 88,
  },
  {
    name: "Ishita Rao",
    city: "Bengaluru",
    image: IMG.p3,
    product: "The Lumen",
    quote: "I always slept hot. The Lumen stays cool until dawn, quietly, without any fuss. It is the calmest thing in my home.",
    rating: 5,
    before: 71,
    after: 93,
  },
  {
    name: "Arjun Kapoor",
    city: "Pune",
    image: IMG.p4,
    product: "The Shakshi Signature",
    quote: "My partner and I move constantly. Neither of us feels it any more. We both wake up rested, which is a small miracle.",
    rating: 5,
    before: 65,
    after: 89,
  },
  {
    name: "Meera Sethi",
    city: "Hyderabad",
    image: IMG.p6,
    product: "The Atelier",
    quote: "You can feel the handwork. It smells faintly of wool and sunshine, and it has made our whole bedroom feel slower.",
    rating: 5,
    before: 70,
    after: 90,
  },
];

// Reviews
export type Review = {
  id: string;
  product: string;
  name: string;
  rating: number;
  title: string;
  body: string;
  position: Position;
  body_type: "petite" | "average" | "broad";
  date: string;
  helpful: number;
  photo?: string;
  verified: boolean;
  reply?: string;
};

export const REVIEWS: Review[] = [
  { id: "r1", product: "*", name: "Ritika S.", rating: 5, title: "Like sinking into a cloud", body: "Took two nights to adjust, and now I resent every hotel bed. My shoulder no longer aches when I sleep on my side.", position: "side", body_type: "petite", date: "2026-08-14", helpful: 48, photo: IMG.tufted, verified: true },
  { id: "r2", product: "*", name: "Vikram N.", rating: 5, title: "Back pain, gone", body: "I'm a heavier back sleeper and was worried about sagging. It holds me perfectly level. The edge support is remarkable.", position: "back", body_type: "broad", date: "2026-07-30", helpful: 36, verified: true },
  { id: "r3", product: "*", name: "Sana K.", rating: 4, title: "Beautiful, a touch firmer than expected", body: "Exquisite craftsmanship. I'd call it medium-firm rather than medium, but after a fortnight it has become perfect for me.", position: "combination", body_type: "average", date: "2026-07-12", helpful: 21, verified: true },
  { id: "r4", product: "*", name: "Dev P.", rating: 5, title: "White-glove delivery was theatre", body: "Two gentlemen in gloves, the bed set up with linen in twenty minutes, and the old mattress quietly taken away.", position: "stomach", body_type: "average", date: "2026-06-28", helpful: 29, photo: IMG.elegant, verified: true },
  { id: "r5", product: "*", name: "Leela M.", rating: 5, title: "I finally sleep cool", body: "Living in Chennai I've never slept without the AC on full. Now it runs at 26° and I'm comfortable until morning.", position: "side", body_type: "average", date: "2026-06-11", helpful: 52, verified: true },
  { id: "r6", product: "*", name: "Rohan G.", rating: 5, title: "Partner-proof", body: "My wife gets up at 5 for yoga, and I don't feel a thing. Motion isolation is exactly as described.", position: "back", body_type: "broad", date: "2026-05-22", helpful: 18, photo: IMG.classic, verified: true },
  { id: "r7", product: "*", name: "Tara V.", rating: 4, title: "Worth every rupee", body: "Expensive, but I spend a third of my life here. The trial made it an easy decision and I never looked back.", position: "combination", body_type: "petite", date: "2026-05-02", helpful: 14, verified: true },
  { id: "r8", product: "*", name: "Imran Q.", rating: 5, title: "Quiet luxury, literally", body: "No springs creaking, no smell, no fuss. It feels like it was made for me by someone who cared.", position: "stomach", body_type: "broad", date: "2026-04-17", helpful: 11, verified: true },
];

export const SHOWROOMS = [
  { id: "mumbai", city: "Mumbai", name: "Shakshi Salon, Kala Ghoda", address: "14 Rampart Row, Kala Ghoda, Mumbai 400001", hours: "11am – 8pm, daily", phone: "+91 22 4000 1100", image: IMG.salon1, lat: 18.9281, lng: 72.8317 },
  { id: "delhi", city: "New Delhi", name: "Shakshi Salon, Mehrauli", address: "Kalka Das Marg, Mehrauli, New Delhi 110030", hours: "11am – 8pm, daily", phone: "+91 11 4000 2200", image: IMG.salon2, lat: 28.5244, lng: 77.1855 },
  { id: "bengaluru", city: "Bengaluru", name: "Shakshi Salon, Indiranagar", address: "100 Feet Road, Indiranagar, Bengaluru 560038", hours: "11am – 8pm, daily", phone: "+91 80 4000 3300", image: IMG.salon3, lat: 12.9719, lng: 77.6412 },
  { id: "hyderabad", city: "Hyderabad", name: "Shakshi Studio, Jubilee Hills", address: "Road No. 36, Jubilee Hills, Hyderabad 500033", hours: "11am – 7pm, Tue–Sun", phone: "+91 40 4000 4400", image: IMG.salon1, lat: 17.4313, lng: 78.4071 },
];

export const CONTACT = {
  phone: "+91 1800 266 8876",
  phoneHref: "tel:+9118002668876",
  whatsapp: "https://wa.me/919800000000?text=Hello%20Shakshi%2C%20I%27d%20love%20some%20help%20choosing%20a%20mattress.",
  email: "concierge@shakshi.example",
};
