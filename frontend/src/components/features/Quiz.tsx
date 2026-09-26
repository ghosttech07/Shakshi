"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { matchMattresses, type Answers, type Match } from "@shakshi/shared/quiz";
import { useStore } from "@/lib/store";
import { useAccount } from "@/lib/account";
import { useCatalog } from "@/lib/catalog-context";
import { track } from "@/lib/analytics";
import { PressureMap } from "./PressureMap";
import { mattressItem } from "@/lib/cart-helpers";
import { EASE, cn, formatINR } from "@shakshi/shared/utils";
import { Img } from "@/components/ui/Img";
import { FirmnessScale } from "@/components/ui/Bits";
import { IconArrow, IconArrowLeft, IconCheck } from "@/components/ui/Icons";

const Figure = ({ d }: { d: ReactNode }) => (
  <svg viewBox="0 0 120 64" className="h-14 w-28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="4" y="44" width="112" height="12" rx="3" opacity=".35" />
    <rect x="8" y="34" width="22" height="10" rx="5" opacity=".5" />
    {d}
  </svg>
);

type Option = { value: string; label: string; note?: string; art?: ReactNode };
type Step = { key: keyof Answers; question: string; hint: string; options: Option[] };

const STEPS: Step[] = [
  {
    key: "position",
    question: "How do you drift off?",
    hint: "Your favourite position shapes where you need softness, and where you need support.",
    options: [
      { value: "side", label: "On my side", art: <Figure d={<><circle cx="22" cy="28" r="6" /><path d="M28 32c14-6 26-4 36 2s22 8 30 2M64 34c-2 6 0 9 6 10" /></>} /> },
      { value: "back", label: "On my back", art: <Figure d={<><circle cx="20" cy="30" r="6" /><path d="M26 36h78M40 36c4-5 12-5 16 0" /></>} /> },
      { value: "stomach", label: "On my front", art: <Figure d={<><circle cx="22" cy="32" r="6" /><path d="M28 40h76M60 40c4-4 10-4 14 0" /></>} /> },
      { value: "combination", label: "A little of everything", art: <Figure d={<><circle cx="22" cy="30" r="6" /><path d="M28 36c20-8 40 6 60-2s16 2 16 2" strokeDasharray="4 4" /></>} /> },
    ],
  },
  {
    key: "body",
    question: "How would you describe your frame?",
    hint: "This helps us understand how deeply you'll sink into each layer.",
    options: [
      { value: "petite", label: "Petite", note: "Lighter, slighter build" },
      { value: "average", label: "Average", note: "Somewhere in the middle" },
      { value: "broad", label: "Broad", note: "Taller or heavier build" },
    ],
  },
  {
    key: "partner",
    question: "Who shares your bed?",
    hint: "Motion isolation matters when someone rises before you.",
    options: [
      { value: "solo", label: "Just me", note: "The whole bed, all to myself" },
      { value: "partner", label: "A partner", note: "Two sleepers, two rhythms" },
      { value: "family", label: "Partner, pets or little ones", note: "A lively, lovely bed" },
    ],
  },
  {
    key: "temperature",
    question: "How do you sleep, temperature-wise?",
    hint: "Some materials breathe more freely than others.",
    options: [
      { value: "hot", label: "I run warm", note: "Duvet off by 3am" },
      { value: "neutral", label: "Just right", note: "Rarely think about it" },
      { value: "cold", label: "I run cool", note: "Socks, always" },
    ],
  },
  {
    key: "pain",
    question: "Do you ever wake with aches?",
    hint: "Back, shoulder or hip discomfort tells us where to add support.",
    options: [
      { value: "none", label: "Rarely", note: "I wake up feeling fine" },
      { value: "sometimes", label: "Sometimes", note: "A stiff morning now and then" },
      { value: "often", label: "Often", note: "It's part of most mornings" },
    ],
  },
  {
    key: "feel",
    question: "What feels like heaven to you?",
    hint: "There's no wrong answer. Follow your instinct.",
    options: [
      { value: "plush", label: "Sinking into a cloud", note: "Plush and cocooning" },
      { value: "medium", label: "A balanced embrace", note: "Held, yet lifted" },
      { value: "firm", label: "Lying on firm ground", note: "Supportive and sculpted" },
      { value: "unsure", label: "I'm not sure", note: "Guide me" },
    ],
  },
  {
    key: "budget",
    question: "What would you like to invest?",
    hint: "Prices for a Queen. Every mattress includes no-cost EMI and a 100-night trial.",
    options: [
      { value: "under80", label: "Up to ₹80,000" },
      { value: "under130", label: "Up to ₹1,30,000" },
      { value: "any", label: "The very best", note: "Whatever makes the difference" },
    ],
  },
];

function Result({ matches, answers, onRestart }: { matches: Match[]; answers: Answers; onRestart: () => void }) {
  const [best, ...rest] = matches;
  const p = best.product;
  const addToCart = useStore((s) => s.addToCart);
  const reduce = useReducedMotion();
  const [pct, setPct] = useState(reduce ? best.score : 0);

  useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 1800);
      setPct(Math.round(best.score * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [best.score, reduce]);

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: EASE }}>
      <p className="eyebrow text-center text-gold">Your match</p>
      <h2 className="display mt-4 text-center text-5xl sm:text-6xl">
        We&rsquo;ve found <em className="text-gold-soft">your</em> mattress.
      </h2>

      <article className="mx-auto mt-12 grid max-w-5xl overflow-hidden bg-ivory text-ink shadow-lift md:grid-cols-2">
        <div className="relative min-h-[320px]">
          <Img src={p.images[0]} alt={`${p.name} in a serene bedroom`} sizes="(min-width: 768px) 50vw, 100vw" wrapperClassName="absolute inset-0" preload />
          <div className="glass absolute left-5 top-5 flex items-center gap-3 rounded-full py-2 pl-2 pr-5">
            <svg width="54" height="54" viewBox="0 0 54 54" className="-rotate-90" aria-hidden>
              <circle cx="27" cy="27" r="23" fill="none" stroke="#1c2230" strokeOpacity=".1" strokeWidth="3" />
              <circle cx="27" cy="27" r="23" fill="none" stroke="#c9a96e" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 144.5} 144.5`} />
            </svg>
            <p>
              <span className="font-serif text-3xl leading-none">{pct}%</span>
              <span className="block text-[0.6rem] uppercase tracking-[0.25em] text-stone">match</span>
            </p>
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <p className="eyebrow text-gold-ink">{p.tier} · {p.firmnessLabel}</p>
          <h3 className="display mt-3 text-4xl">{p.name}</h3>
          <p className="mt-2 text-stone">{p.tagline}</p>
          <div className="mt-6">
            <FirmnessScale value={p.firmness} />
          </div>
          <p className="eyebrow mt-8 text-stone">Why it fits you</p>
          <ul className="mt-4 space-y-3">
            {best.reasons.map((r, i) => (
              <motion.li key={r} className="flex gap-3 text-sm leading-relaxed" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.15, duration: 0.9, ease: EASE }}>
                <IconCheck size={16} className="mt-0.5 shrink-0 text-gold-ink" /> {r}
              </motion.li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button className="btn btn-gold" onClick={() => addToCart(mattressItem(p, "queen"))}>
              Add Queen · {formatINR(p.basePrice)}
            </button>
            <Link href={`/mattress/${p.slug}`} className="link-lux text-sm">
              Explore {p.name}
            </Link>
          </div>
        </div>
      </article>

      <section className="mx-auto mt-6 max-w-5xl bg-ivory p-8 text-ink shadow-lift sm:p-10" aria-labelledby="pressure-title">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <p className="eyebrow text-gold-ink">How it holds you</p>
            <h3 id="pressure-title" className="display mt-3 text-3xl sm:text-4xl">
              Your body, on {p.name.replace("The ", "the ")}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-stone">
              Lying on your {answers.position === "combination" || !answers.position ? "favourite side and back" : answers.position}, this is where the mattress meets you. Lighter tones mean weight is spread evenly; deeper tones mark where pressure gathers.
            </p>
            <Link href="/showroom?kind=video#book" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink hover:text-ink">
              Talk it through with a sleep specialist <IconArrow size={14} />
            </Link>
          </div>
          <PressureMap product={p} answers={answers} />
        </div>
      </section>

      <div className="mx-auto mt-14 max-w-5xl">
        <p className="eyebrow text-pearl/50">Also worth dreaming about</p>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {rest.slice(0, 2).map((m) => (
            <li key={m.product.slug}>
              <Link href={`/mattress/${m.product.slug}`} className="group flex items-center gap-5 border border-pearl/10 p-4 transition-colors duration-700 hover:border-gold/60">
                <Img src={m.product.images[0]} alt="" sizes="96px" dark wrapperClassName="h-20 w-20 shrink-0" />
                <div className="flex-1">
                  <p className="font-serif text-2xl">{m.product.name}</p>
                  <p className="text-xs text-pearl/55">{m.product.firmnessLabel} · from {formatINR(m.product.basePrice)}</p>
                </div>
                <p className="font-serif text-2xl text-gold">{m.score}%</p>
              </Link>
            </li>
          ))}
        </ul>
        <button onClick={onRestart} className="mt-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-pearl/60 hover:text-pearl">
          <IconArrowLeft size={14} /> Retake the quiz
        </button>
      </div>
    </motion.div>
  );
}

export function Quiz() {
  const { products } = useCatalog();
  const setQuiz = useAccount((s) => s.setQuiz);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => heading.current?.focus({ preventScroll: true }), [step]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const s = STEPS[step];
  const finish = (final: Answers) => {
    setDone(true);
    const [best] = matchMattresses(final, products);
    setQuiz({ answers: final, match: best.product.slug, score: best.score, at: new Date().toISOString() });
    track("quiz_complete", { match: best.product.slug, score: best.score, position: final.position ?? "" });
    // Kept for the team's follow-up and to learn what sleepers need.
    let sessionId = "";
    try {
      sessionId = sessionStorage.getItem("shk-sid") ?? "";
    } catch {}
    fetch("/api/quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: final, match: best.product.slug, score: best.score, sessionId }) }).catch(() => {});
  };

  const choose = (v: string) => {
    if (step === 0 && !answers.position) track("quiz_start");
    const next = { ...answers, [s.key]: v };
    setAnswers(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setDir(1);
      if (step === STEPS.length - 1) finish(next);
      else setStep(step + 1);
    }, 550);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setDone(false);
  };

  if (done) return <Result matches={matchMattresses(answers, products)} answers={answers} onRestart={restart} />;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 60 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -60 }),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-pearl/50">
        <button
          onClick={() => {
            setDir(-1);
            setStep(Math.max(0, step - 1));
          }}
          disabled={step === 0}
          className="flex items-center gap-2 transition-opacity hover:text-pearl disabled:opacity-0"
        >
          <IconArrowLeft size={14} /> Back
        </button>
        <span aria-live="polite">
          {step + 1} of {STEPS.length}
        </span>
      </div>
      <div className="mt-4 h-px bg-pearl/10" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Quiz progress">
        <motion.div className="h-px bg-gold" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ duration: 1, ease: EASE }} />
      </div>

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.8, ease: EASE }} className="pt-14">
          <h2 ref={heading} tabIndex={-1} className="display text-4xl focus:outline-none sm:text-5xl lg:text-6xl">
            {s.question}
          </h2>
          <p className="mt-4 max-w-lg text-pearl/60">{s.hint}</p>
          <div role="radiogroup" aria-label={s.question} className={cn("mt-10 grid gap-3", s.options.length === 4 ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
            {s.options.map((o, i) => {
              const selected = answers[s.key] === o.value;
              return (
                <motion.button
                  key={o.value}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => choose(o.value)}
                  initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.8, ease: EASE }}
                  className={cn(
                    "group flex flex-col items-start gap-3 border p-6 text-left transition-all duration-700 ease-silk",
                    selected ? "border-gold bg-gold/12 shadow-glow" : "border-pearl/12 hover:-translate-y-1 hover:border-gold/60 hover:bg-pearl/[0.03]"
                  )}
                >
                  {o.art && <span className={cn("transition-colors duration-700", selected ? "text-gold" : "text-pearl/60 group-hover:text-gold-soft")}>{o.art}</span>}
                  <span className="font-serif text-2xl">{o.label}</span>
                  {o.note && <span className="text-sm text-pearl/55">{o.note}</span>}
                  <span className={cn("mt-auto grid h-5 w-5 place-items-center rounded-full border transition-all duration-700", selected ? "border-gold bg-gold text-midnight" : "border-pearl/25")}>
                    {selected && <IconCheck size={12} />}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {step > 0 && answers[s.key] && (
        <button onClick={() => (step === STEPS.length - 1 ? finish(answers) : setStep(step + 1))} className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-gold hover:text-gold-soft">
          Continue <IconArrow size={14} />
        </button>
      )}
    </div>
  );
}
