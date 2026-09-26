import { PRODUCTS, SIZES, ACCESSORIES, SHOWROOMS, CONTACT } from "./products";
import { formatINR } from "./utils";

/** Everything the concierge is allowed to know, rendered once as plain text. */
export const KNOWLEDGE = `
BRAND: Shakshi, a luxury mattress atelier in India. Handcrafted mattresses, sold online and in showrooms.

MATTRESSES (prices are for Queen; other sizes scale):
${PRODUCTS.map(
  (p) =>
    `- ${p.name} (/mattress/${p.slug}) — ${p.firmnessLabel}, firmness ${p.firmness}/10, ${p.height}cm tall, from ${formatINR(
      p.basePrice
    )}. Feeling: ${p.feeling}. Best for ${p.positions.join(", ")} sleepers. Cooling ${p.cooling}/5, motion isolation ${
      p.motionIsolation
    }/5. Layers: ${p.layers.map((l) => `${l.name} (${l.material})`).join("; ")}. Highlights: ${p.highlights.join("; ")}.`
).join("\n")}

SIZES: ${SIZES.map((s) => `${s.label} ${s.dims}`).join("; ")}.
ACCESSORIES: ${ACCESSORIES.map((a) => `${a.name} ${formatINR(a.price)}`).join("; ")}. Aurelia bed frame ${formatINR(58000)}. Old-mattress removal ${formatINR(1500)}.

POLICIES:
- 100-night home trial. Sleep on it for at least 21 nights; if it isn't right, we collect it free and refund in full.
- 10-year warranty against sagging over 2.5cm and manufacturing defects.
- Free white-glove delivery: two-person team, full set-up, packaging removed. Metro cities (Delhi NCR, Mumbai, Pune, Bengaluru, Hyderabad, Chennai, Kolkata, Ahmedabad, Jaipur, Chandigarh) in 3–5 days; elsewhere in India 6–9 days.
- No-cost EMI over 3, 6 or 12 months on major cards; pay-later options available at checkout.
- Complimentary pair of Cloud Pillows on orders above ${formatINR(100000)}.
- Free fabric swatches can be requested on the Sleep Studio page (/sleep-studio).
- Care: rotate head-to-foot every 3 months for the first year, then every 6. Spot-clean only. Use a protector.

SHOWROOMS: ${SHOWROOMS.map((s) => `${s.name}, ${s.address} (${s.hours})`).join("; ")}. Book at /showroom.
TOOLS ON SITE: Sleep Quiz (/quiz), Build Your Bed configurator (/build-your-bed), Firmness simulator and sleep-cycle calculator (/sleep-studio).
CONTACT: phone ${CONTACT.phone}, email ${CONTACT.email}, WhatsApp available.
`.trim();

type Rule = { test: RegExp; reply: string };

// Used when no Anthropic credentials are configured, so the widget still helps.
const RULES: Rule[] = [
  {
    test: /side\s*sleep|shoulder|hip/i,
    reply:
      "For side sleepers I'd gently suggest **The Cirrus**: its plush, cradling layers let shoulders and hips sink just enough while the spring core keeps you aligned. If you prefer a little more lift, **The Shakshi Signature** is our balanced favourite. The [Sleep Quiz](/quiz) will confirm it in under a minute.",
  },
  {
    test: /back\s*(pain|ache)|lower back|spine/i,
    reply:
      "For back comfort, the zoned support in **The Shakshi Signature** (medium) or **The Sovereign** (luxe firm) holds the spine beautifully: firmer beneath the hips, softer at the shoulders. Many guests with back pain tell us their mornings changed within a fortnight.",
  },
  {
    test: /hot|cool|warm|sweat|temperature/i,
    reply:
      "If you sleep warm, **The Lumen** was made for you: ventilated latex, phase-change gel and a cool-touch Tencel™ cover keep the surface up to 3°C cooler, all night long.",
  },
  {
    test: /stomach/i,
    reply: "Stomach sleepers are happiest a little firmer, so **The Atelier** (medium-firm, natural latex) or **The Sovereign** (luxe firm) keep your hips level and your back at ease.",
  },
  {
    test: /trial|return|refund|100/i,
    reply:
      "You have **100 nights** to decide. We ask you to give it at least 21 nights, as your body takes a little time to settle in. If it isn't right, we collect it from your home at no cost and refund you in full.",
  },
  {
    test: /deliver|shipping|pincode|when.*arrive|white.?glove/i,
    reply:
      "Delivery is always complimentary and white-glove: a two-person team sets everything up and takes the packaging away. Metro cities receive in **3–5 days**, the rest of India in **6–9 days**. Enter your pincode on any mattress page for an exact date.",
  },
  {
    test: /warrant/i,
    reply: "Every Shakshi mattress carries a **10-year warranty** covering sagging deeper than 2.5cm and any manufacturing defect.",
  },
  {
    test: /emi|instal|pay later|finance|payment/i,
    reply: "You can spread the cost with **no-cost EMI** over 3, 6 or 12 months on major cards, or choose pay-later at checkout. The Shakshi Signature, for example, is from about ₹7,500 a month.",
  },
  {
    test: /showroom|visit|store|try|salon/i,
    reply: `We'd love to welcome you: our salons are in ${SHOWROOMS.map((s) => s.city).join(", ")}. [Book a private visit](/showroom) and we'll prepare the beds you're curious about, with tea.`,
  },
  {
    test: /couple|partner|wife|husband|move/i,
    reply: "For couples, **The Shakshi Signature** and **The Cirrus** isolate movement exceptionally well: individually wrapped coils mean one of you can rise at dawn without waking the other.",
  },
  {
    test: /swatch|fabric|colou?r|sample/i,
    reply: "We'll happily post you free fabric swatches of our covers: Ivory, Oat, Taupe, Blush and Midnight. [Request them here](/sleep-studio#swatches).",
  },
  {
    test: /price|cost|cheap|expensive|budget/i,
    reply: `Our Queen mattresses range from ${formatINR(64900)} (The Cirrus) to ${formatINR(169900)} (The Sovereign), with no-cost EMI and a 100-night trial on every one.`,
  },
  {
    test: /natural|organic|eco|latex|allerg/i,
    reply: "**The Atelier** is our most natural mattress: organic latex, Merino wool, GOTS cotton and a coconut-coir base, with no synthetic foams. It's naturally hypoallergenic and hand-tufted in our workshop.",
  },
];

export function guideReply(message: string) {
  const hit = RULES.find((r) => r.test.test(message));
  if (hit) return hit.reply;
  return "I'd be delighted to help. Tell me a little about how you sleep: your usual position, whether you run warm, and if you share the bed. Or take our [Sleep Quiz](/quiz) for a personal match. You can also reach a human concierge on WhatsApp or at " + CONTACT.phone + ".";
}
