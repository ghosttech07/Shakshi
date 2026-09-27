import { isAdmin } from "@/lib/server/studio";
import { audit, getDoc, saveDocDraft } from "@/lib/server/content";
import { shape } from "@/lib/server/shape";
import { bad, body, json } from "@/lib/server/http";
import { DEFAULT_QUIZ, type QuizConfig } from "@shakshi/shared/quiz";

export const runtime = "nodejs";

const TEMPLATE: QuizConfig = {
  steps: [{ key: "position", question: "", hint: "", hidden: false, options: [{ value: "", label: "", note: "", image: "", boost: [""] }] }],
  logic: { ...DEFAULT_QUIZ.logic, zoned: [""] },
};

/** Wording and images are free; step keys and option values must be ones the scoring understands. */
function clean(input: unknown): QuizConfig {
  const q = shape(TEMPLATE, input);
  const steps = q.steps
    .filter((s) => DEFAULT_QUIZ.steps.some((d) => d.key === s.key))
    .map((s) => {
      const allowed = DEFAULT_QUIZ.steps.find((d) => d.key === s.key)!.options.map((o) => o.value);
      return { ...s, options: s.options.filter((o) => allowed.includes(o.value)).map((o) => ({ ...o, boost: (o.boost ?? []).filter(Boolean) })) };
    });
  return { steps, logic: { ...q.logic, zoned: q.logic.zoned.filter(Boolean) } };
}

export async function GET() {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  return json(await getDoc<QuizConfig>("quiz", DEFAULT_QUIZ));
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body<{ doc: QuizConfig; autosave?: boolean }>(req, 200_000);
  if (!b?.doc) return bad("Bad request");
  const row = await saveDocDraft("quiz", clean(b.doc), DEFAULT_QUIZ);
  if (!b.autosave) await audit("quiz.save", "quiz");
  return json({ ok: true, updatedAt: row.updatedAt });
}
