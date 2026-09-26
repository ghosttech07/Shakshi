import { isAdmin } from "@/lib/server/studio";
import { audit, deletePage, getPageRow, saveDraft } from "@/lib/server/content";
import { bad, body, json } from "@/lib/server/http";
import type { PageDoc } from "@shakshi/shared/cms/types";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ key: string }> };
const k = async (ctx: Ctx) => decodeURIComponent((await ctx.params).key);

export async function GET(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const row = await getPageRow(await k(ctx));
  return row ? json(row) : bad("Not found", 404);
}

/** Saves the draft (autosave and manual save). Nothing changes on the live site until Publish. */
export async function PUT(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const key = await k(ctx);
  const b = await body<{ doc: PageDoc; autosave?: boolean }>(req, 800_000);
  if (!b?.doc) return bad("Bad request");
  const row = await saveDraft(key, b.doc);
  if (!b.autosave) await audit("page.save", key, `${row.draft.sections.length} sections`);
  return json({ ok: true, updatedAt: row.updatedAt });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  return (await deletePage(await k(ctx))) ? json({ ok: true }) : bad("Built-in pages can't be deleted, only edited.");
}
