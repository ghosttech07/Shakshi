import { isAdmin } from "@/lib/server/studio";
import { publishDoc } from "@/lib/server/content";
import { notifyStorefront } from "@/lib/server/notify";
import { bad, json } from "@/lib/server/http";
import { DEFAULT_QUIZ } from "@shakshi/shared/quiz";

export const runtime = "nodejs";

export async function POST() {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const row = await publishDoc("quiz", DEFAULT_QUIZ);
  await notifyStorefront();
  return json({ ok: true, publishedAt: row.publishedAt });
}
