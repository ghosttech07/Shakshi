import type { Product, Position } from "./products";
import { clamp } from "./utils";

export type Answers = {
  position?: Position;
  body?: "petite" | "average" | "broad";
  partner?: "solo" | "partner" | "family";
  temperature?: "hot" | "neutral" | "cold";
  pain?: "none" | "sometimes" | "often";
  feel?: "plush" | "medium" | "firm" | "unsure";
  budget?: "under80" | "under130" | "any";
};

export type Match = { product: Product; score: number; reasons: string[] };

const BUDGET_CAP = { under80: 80000, under130: 130000, any: Infinity } as const;

export function idealFirmness(a: Answers) {
  let f = { side: 4, back: 6.5, stomach: 7.5, combination: 5.5 }[a.position ?? "combination"];
  if (a.body === "petite") f -= 1;
  if (a.body === "broad") f += 1;
  if (a.pain === "often") f += 0.5;
  const pref = a.feel && a.feel !== "unsure" ? { plush: 3, medium: 6, firm: 8 }[a.feel] : null;
  if (pref !== null) f = (f + pref) / 2;
  return clamp(f, 2, 9);
}

export function matchMattresses(a: Answers, products: Product[]): Match[] {
  const ideal = idealFirmness(a);
  const results = products.map((p) => {
    let score = 100 - Math.abs(ideal - p.firmness) * 9;
    const reasons: string[] = [];

    if (a.position && p.positions.includes(a.position)) {
      score += 5;
      reasons.push(
        {
          side: "Softly releases pressure at the shoulders and hips, so side sleep feels effortless.",
          back: "Keeps the natural curve of your spine gently supported through the night.",
          stomach: "Holds your hips level, so your lower back never sinks out of line.",
          combination: "Responsive enough to turn with you, without ever waking you.",
        }[a.position]
      );
    }
    if (Math.abs(ideal - p.firmness) <= 1) reasons.push(`Its ${p.firmnessLabel.toLowerCase()} feel sits right where your body asked to be.`);

    if (a.temperature === "hot") {
      score += (p.cooling - 3) * 5;
      if (p.cooling >= 4) reasons.push("Cooling layers draw heat away, so you stay temperate until morning.");
    }
    if (a.temperature === "cold" && p.materials.includes("wool")) {
      score += 4;
      reasons.push("Natural wool keeps a gentle, even warmth on cooler nights.");
    }
    if (a.partner && a.partner !== "solo") {
      score += (p.motionIsolation - 3) * 4;
      if (p.motionIsolation >= 4) reasons.push("Individually wrapped coils absorb movement, so a restless partner goes unnoticed.");
    }
    if (a.pain && a.pain !== "none") {
      const zoned = p.slug === "signature" || p.slug === "sovereign";
      score += zoned ? 5 : p.firmness >= 5 ? 2 : -2;
      if (zoned) reasons.push("Zoned support lifts where your back needs it most.");
    }
    if (a.body === "broad") score += (p.edgeSupport - 3) * 3;

    const cap = BUDGET_CAP[a.budget ?? "any"];
    if (p.basePrice > cap) score -= 18;
    else if (a.budget && a.budget !== "any") reasons.push("Comfortably within the investment you had in mind.");

    return { product: p, score, reasons: reasons.slice(0, 4) };
  });

  results.sort((x, y) => y.score - x.score);
  const top = results[0].score;
  // Express as a match percentage: the best fit lands in the mid-90s, the rest relative to it.
  return results.map((r) => ({ ...r, score: clamp(Math.round(97 - (top - r.score) * 0.8), 58, 98) }));
}
