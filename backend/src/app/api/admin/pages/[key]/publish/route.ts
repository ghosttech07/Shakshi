import { isAdmin } from "@/lib/server/studio";
import { publishPage } from "@/lib/server/content";
import { notifyStorefront } from "@/lib/server/notify";
import { bad, body, json, str } from "@/lib/server/http";

export const runtime = "nodejs";

/** Draft → live. Keeps a version, logs it, and asks the storefront to refresh that page now. */
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const key = decodeURIComponent((await params).key);
  const b = await body(req);
  const row = await publishPage(key, str(b?.note, 200));
  if (!row) return bad("Not found", 404);
  await notifyStorefront();
  return json({ ok: true, publishedAt: row.publishedAt });
}
