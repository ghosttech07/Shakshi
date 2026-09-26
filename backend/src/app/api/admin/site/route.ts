import { isAdmin } from "@/lib/server/studio";
import { audit, getDoc, mergeSite, saveDocDraft } from "@/lib/server/content";
import { shape } from "@/lib/server/shape";
import { SITE_TEMPLATE } from "@/lib/server/site-template";
import { bad, body, json } from "@/lib/server/http";
import { DEFAULT_SITE } from "@shakshi/shared/cms/defaults";
import type { SiteConfig } from "@shakshi/shared/cms/types";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const d = await getDoc<SiteConfig>("site", DEFAULT_SITE);
  return json({ draft: mergeSite(d.draft), published: d.published ? mergeSite(d.published) : null, publishedAt: d.publishedAt, updatedAt: d.updatedAt });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body<{ site: SiteConfig; autosave?: boolean }>(req, 400_000);
  if (!b?.site) return bad("Bad request");
  const clean = shape(SITE_TEMPLATE, b.site);
  const row = await saveDocDraft("site", clean, DEFAULT_SITE);
  if (!b.autosave) await audit("site.save", "site");
  return json({ ok: true, updatedAt: row.updatedAt });
}
