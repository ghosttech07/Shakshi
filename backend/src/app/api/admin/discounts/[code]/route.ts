import { isAdmin } from "@/lib/server/studio";
import { remove, update } from "@/lib/server/db";
import { audit } from "@/lib/server/content";
import { bad, body, json } from "@/lib/server/http";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ code: string }> };

/** Pause or resume a code. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const code = decodeURIComponent((await params).code);
  const b = await body(req);
  if (typeof b?.active !== "boolean") return bad("Bad request");
  const row = await update("discount_codes", code, { status: b.active ? "active" : "paused", data: { active: b.active } });
  if (!row) return bad("Not found", 404);
  await audit(b.active ? "discount.resume" : "discount.pause", code);
  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const code = decodeURIComponent((await params).code);
  await remove("discount_codes", code);
  await audit("discount.delete", code);
  return json({ ok: true });
}
