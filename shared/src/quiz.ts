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

/** The quiz as the studio edits it: wording, images and the scoring logic. Option values are fixed (the logic reads them). */
export type QuizOption = { value: string; label: string; note?: string; image?: string; /** product slugs this answer favours */ boost?: string[] };
export type QuizStep = { key: keyof Answers; question: string; hint: string; hidden?: boolean; options: QuizOption[] };
export type QuizLogic = {
  positionFirmness: Record<Position, number>;
  bodyAdjust: number;
  painAdjust: number;
  firmnessWeight: number;
  coolingWeight: number;
  motionWeight: number;
  zoned: string[];
  zonedBonus: number;
  budgetCaps: { under80: number; under130: number };
  budgetPenalty: number;
  boostBonus: number;
};
export type QuizConfig = { steps: QuizStep[]; logic: QuizLogic };

export const DEFAULT_QUIZ: QuizConfig = {
  steps: [
    { key: "position", question: "How do you drift off?", hint: "Your favourite position shapes where you need softness, and where you need support.", options: [
      { value: "side", label: "On my side" }, { value: "back", label: "On my back" }, { value: "stomach", label: "On my front" }, { value: "combination", label: "A little of everything" },
    ] },
    { key: "body", question: "How would you describe your frame?", hint: "This helps us understand how deeply you'll sink into each layer.", options: [
      { value: "petite", label: "Petite", note: "Lighter, slighter build" }, { value: "average", label: "Average", note: "Somewhere in the middle" }, { value: "broad", label: "Broad", note: "Taller or heavier build" },
    ] },
    { key: "partner", question: "Who shares your bed?", hint: "Motion isolation matters when someone rises before you.", options: [
      { value: "solo", label: "Just me", note: "The whole bed, all to myself" }, { value: "partner", label: "A partner", note: "Two sleepers, two rhythms" }, { value: "family", label: "Partner, pets or little ones", note: "A lively, lovely bed" },
    ] },
    { key: "temperature", question: "How do you sleep, temperature-wise?", hint: "Some materials breathe more freely than others.", options: [
      { value: "hot", label: "I run warm", note: "Duvet off by 3am" }, { value: "neutral", label: "Just right", note: "Rarely think about it" }, { value: "cold", label: "I run cool", note: "Socks, always" },
    ] },
    { key: "pain", question: "Do you ever wake with aches?", hint: "Back, shoulder or hip discomfort tells us where to add support.", options: [
      { value: "none", label: "Rarely", note: "I wake up feeling fine" }, { value: "sometimes", label: "Sometimes", note: "A stiff morning now and then" }, { value: "often", label: "Often", note: "It's part of most mornings" },
    ] },
    { key: "feel", question: "What feels like heaven to you?", hint: "There's no wrong answer. Follow your instinct.", options: [
      { value: "plush", label: "Sinking into a cloud", note: "Plush and cocooning" }, { value: "medium", label: "A balanced embrace", note: "Held, yet lifted" }, { value: "firm", label: "Lying on firm ground", note: "Supportive and sculpted" }, { value: "unsure", label: "I'm not sure", note: "Guide me" },
    ] },
    { key: "budget", question: "What would you like to invest?", hint: "Prices for a Queen. Every mattress includes no-cost EMI and a 100-night trial.", options: [
      { value: "under80", label: "Up to ₹80,000" }, { value: "under130", label: "Up to ₹1,30,000" }, { value: "any", label: "The very best", note: "Whatever makes the difference" },
    ] },
  ],
  logic: {
    positionFirmness: { side: 4, back: 6.5, stomach: 7.5, combination: 5.5 },
    bodyAdjust: 1,
    painAdjust: 0.5,
    firmnessWeight: 9,
    coolingWeight: 5,
    motionWeight: 4,
    zoned: ["signature", "sovereign"],
    zonedBonus: 5,
    budgetCaps: { under80: 80000, under130: 130000 },
    budgetPenalty: 18,
    boostBonus: 8,
  },
};

export function idealFirmness(a: Answers, logic: QuizLogic = DEFAULT_QUIZ.logic) {
  let f = logic.positionFirmness[a.position ?? "combination"];
  if (a.body === "petite") f -= logic.bodyAdjust;
  if (a.body === "broad") f += logic.bodyAdjust;
  if (a.pain === "often") f += logic.painAdjust;
  const pref = a.feel && a.feel !== "unsure" ? { plush: 3, medium: 6, firm: 8 }[a.feel] : null;
  if (pref !== null) f = (f + pref) / 2;
  return clamp(f, 2, 9);
}

export function matchMattresses(a: Answers, products: Product[], config: QuizConfig = DEFAULT_QUIZ): Match[] {
  const L = config.logic;
  const ideal = idealFirmness(a, L);
  const boosts = new Set(config.steps.flatMap((s) => s.options.filter((o) => a[s.key] === o.value).flatMap((o) => o.boost ?? [])));
  const results = products.map((p) => {
    let score = 100 - Math.abs(ideal - p.firmness) * L.firmnessWeight;
    if (boosts.has(p.slug)) score += L.boostBonus;
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
      score += (p.cooling - 3) * L.coolingWeight;
      if (p.cooling >= 4) reasons.push("Cooling layers draw heat away, so you stay temperate until morning.");
    }
    if (a.temperature === "cold" && p.materials.includes("wool")) {
      score += 4;
      reasons.push("Natural wool keeps a gentle, even warmth on cooler nights.");
    }
    if (a.partner && a.partner !== "solo") {
      score += (p.motionIsolation - 3) * L.motionWeight;
      if (p.motionIsolation >= 4) reasons.push("Individually wrapped coils absorb movement, so a restless partner goes unnoticed.");
    }
    if (a.pain && a.pain !== "none") {
      const zoned = L.zoned.includes(p.slug);
      score += zoned ? L.zonedBonus : p.firmness >= 5 ? 2 : -2;
      if (zoned) reasons.push("Zoned support lifts where your back needs it most.");
    }
    if (a.body === "broad") score += (p.edgeSupport - 3) * 3;

    const cap = a.budget && a.budget !== "any" ? L.budgetCaps[a.budget] : Infinity;
    if (p.basePrice > cap) score -= L.budgetPenalty;
    else if (a.budget && a.budget !== "any") reasons.push("Comfortably within the investment you had in mind.");

    return { product: p, score, reasons: reasons.slice(0, 4) };
  });

  results.sort((x, y) => y.score - x.score);
  if (!results.length) return [];
  const top = results[0].score;
  // Express as a match percentage: the best fit lands in the mid-90s, the rest relative to it.
  return results.map((r) => ({ ...r, score: clamp(Math.round(97 - (top - r.score) * 0.8), 58, 98) }));
}
