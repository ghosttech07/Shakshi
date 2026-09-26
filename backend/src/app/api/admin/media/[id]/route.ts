import { isAdmin } from "@/lib/server/studio";
import { get, remove, update } from "@/lib/server/db";
import { usageOf, type MediaData } from "@/lib/server/media";
import { audit } from "@/lib/server/content";
import { bad, body, json, str } from "@/lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const row = await get<MediaData>("media", (await params).id);
  if (!row) return bad("Not found", 404);
  return json({ id: row.id, ...row.data, usedIn: await usageOf(row.data.url) });
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body(req);
  const row = await update<MediaData>("media", (await params).id, { data: { alt: str(b?.alt, 300) } });
  return row ? json({ ok: true }) : bad("Not found", 404);
}

/** Refuses while the file is still used anywhere, and says where. */
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const id = (await params).id;
  const row = await get<MediaData>("media", id);
  if (!row) return bad("Not found", 404);
  const usedIn = await usageOf(row.data.url);
  if (usedIn.length) return json({ error: "This file is still in use.", usedIn }, 409);
  await remove("media", id);
  await audit("media.delete", id, row.data.name);
  return json({ ok: true });
}
