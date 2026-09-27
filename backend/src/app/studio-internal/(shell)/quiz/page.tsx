import { requireStudio } from "@/lib/server/studio";
import { getDoc } from "@/lib/server/content";
import { editorContext } from "@/lib/server/studio-data";
import { DEFAULT_QUIZ, type QuizConfig } from "@shakshi/shared/quiz";
import type { SiteGroup } from "@shakshi/shared/cms/site-fields";
import type { Field } from "@shakshi/shared/cms/types";
import { PageHead } from "@/components/studio/ui";
import { DocEditor } from "@/components/studio/DocEditor";

export const metadata = { title: "Sleep Quiz" };

const n = (key: string, label: string, help?: string): Field => ({ key, label, type: "number", help });

const GROUPS: SiteGroup[] = [
  {
    id: "questions",
    title: "Questions",
    description: "Reorder, reword or hide questions, and give answers a photo. Each answer's code is what the matching logic reads, so leave it as it is.",
    path: "",
    fields: [
      {
        key: "steps",
        label: "Questions",
        type: "list",
        itemLabel: "question",
        of: [
          { key: "question", label: "Question", type: "text" },
          { key: "hint", label: "Helper line", type: "textarea" },
          { key: "hidden", label: "Hidden", type: "toggle", help: "Skip this question" },
          {
            key: "options",
            label: "Answers",
            type: "list",
            itemLabel: "label",
            of: [
              { key: "label", label: "Answer", type: "text" },
              { key: "note", label: "Small print", type: "text" },
              { key: "image", label: "Photo (optional)", type: "image" },
              { key: "boost", label: "Favour these mattresses", type: "products", help: "Chosen mattresses get a lift in the match when a sleeper picks this answer." },
              { key: "value", label: "Answer code (read by the logic)", type: "text", help: "Don't change this." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "logic",
    title: "Matching logic",
    description: "How answers turn into a match. Firmness runs from 1 (plush) to 10 (firm).",
    path: "logic",
    fields: [
      n("positionFirmness.side", "Ideal firmness: side sleepers"),
      n("positionFirmness.back", "Ideal firmness: back sleepers"),
      n("positionFirmness.stomach", "Ideal firmness: front sleepers"),
      n("positionFirmness.combination", "Ideal firmness: combination sleepers"),
      n("bodyAdjust", "Firmness shift for petite / broad frames"),
      n("painAdjust", "Extra firmness for frequent aches"),
      n("firmnessWeight", "Weight of firmness fit", "Points lost per step away from the ideal firmness"),
      n("coolingWeight", "Weight of cooling (for warm sleepers)"),
      n("motionWeight", "Weight of motion isolation (for shared beds)"),
      { key: "zoned", label: "Mattresses with zoned support", type: "products" },
      n("zonedBonus", "Bonus for zoned support when aches are reported"),
      n("budgetCaps.under80", "First budget answer: up to ₹"),
      n("budgetCaps.under130", "Second budget answer: up to ₹"),
      n("budgetPenalty", "Penalty for being over budget"),
      n("boostBonus", "Bonus for a “favoured” mattress"),
    ],
  },
];

export default async function QuizPage() {
  await requireStudio();
  const [d, ctx] = await Promise.all([getDoc<QuizConfig>("quiz", DEFAULT_QUIZ), editorContext()]);
  return (
    <>
      <PageHead eyebrow="Content" title="Sleep Quiz" intro="The questions sleepers answer, and how the answers choose their mattress." />
      <DocEditor
        groups={GROUPS}
        initial={d as unknown as { draft: Record<string, unknown>; published: Record<string, unknown> | null; updatedAt?: string }}
        url="/api/admin/quiz"
        bodyKey="doc"
        ctx={ctx}
        liveUrl={`${process.env.FRONTEND_URL ?? "http://localhost:3000"}/quiz`}
      />
    </>
  );
}
