import { insert } from "@/lib/server/db";
import { bad, body, isEmail, json, limited, num, str } from "@/lib/server/http";

export const runtime = "nodejs";

const KEYS = ["position", "body", "partner", "temperature", "pain", "feel", "budget"];

/** Keeps each completed quiz so the team can follow up (and learn what people need). */
export async function POST(req: Request) {
  if (limited(req, "quiz", 10)) return bad("Too many attempts", 429);
  const b = await body(req);
  if (!b || typeof b.answers !== "object" || !b.answers) return bad("Bad request");
  const answers = Object.fromEntries(KEYS.map((k) => [k, str((b.answers as Record<string, unknown>)[k], 20)]));
  const email = str(b.email, 120).toLowerCase();
  const row = await insert(
    "quiz_results",
    { answers, match: str(b.match, 30), score: num(b.score) || 0, sessionId: str(b.sessionId, 60) },
    { email: email && isEmail(email) ? email : undefined, status: "new" }
  );
  return json({ id: row.id });
}
