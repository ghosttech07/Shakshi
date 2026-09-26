import { isAdmin } from "@/lib/server/studio";
import { publishDoc } from "@/lib/server/content";
import { notifyStorefront } from "@/lib/server/notify";
import { bad, json } from "@/lib/server/http";
import { DEFAULT_SITE } from "@shakshi/shared/cms/defaults";

export const runtime = "nodejs";

export async function POST() {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const row = await publishDoc("site", DEFAULT_SITE);
  await notifyStorefront();
  return json({ ok: true, publishedAt: row.publishedAt });
}
