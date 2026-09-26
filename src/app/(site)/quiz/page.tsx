import type { Metadata } from "next";
import { Quiz } from "@/components/features/Quiz";

export const metadata: Metadata = {
  title: "The Sleep Quiz · Mattress Matchmaker",
  description: "Seven gentle questions about how you sleep, and we'll match you to the Shakshi mattress your body has been waiting for.",
  alternates: { canonical: "/quiz" },
};

export default function QuizPage() {
  return (
    <section data-dark-hero className="relative min-h-[100svh] overflow-hidden bg-midnight pb-28 pt-32 text-pearl linen-dark lg:pt-40">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_40%_at_80%_10%,rgb(201_169_110/0.14),transparent),radial-gradient(40%_40%_at_10%_90%,rgb(230_199_189/0.08),transparent)]" />
      <div className="container-lux relative">
        <p className="eyebrow text-center text-gold">The Sleep Quiz</p>
        <h1 className="sr-only">Find your perfect Shakshi mattress</h1>
        <div className="mt-10">
          <Quiz />
        </div>
      </div>
    </section>
  );
}
