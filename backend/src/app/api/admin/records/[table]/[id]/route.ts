import { notifyStorefront } from "@/lib/server/notify";
import { audit } from "@/lib/server/content";
import { isAdmin } from "@/lib/server/studio";
import { remove, update, type Table } from "@/lib/server/db";
import { bad, body, json, str } from "@/lib/server/http";
import { STAGES } from "@shakshi/shared/orders";

export const runtime = "nodejs";

const EDITABLE: Partial<Record<Table, string[]>> = {
  orders: STAGES.map((s) => s.id),
  bookings: ["requested", "confirmed", "completed", "cancelled"],
  leads: ["new", "handled"],
  abandoned_carts: ["open", "contacted", "recovered", "closed"],
  reviews: ["pending", "approved", "hidden"],
};

type Ctx = { params: Promise<{ table: string; id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const { table, id } = await params;
  const allowed = EDITABLE[table as Table];
  if (!allowed) return bad("Not editable");
  const b = await body(req);
  if (!b) return bad("Bad request");

  // Orders: choosing a stage pins it (manual); "auto" hands tracking back to the calendar.
  if (table === "orders" && b.statusMode === "auto") {
    const row = await update("orders", id, { data: { statusMode: "auto" } });
    return row ? json({ ok: true }) : bad("Not found", 404);
  }
  // Reviews: the atelier can answer publicly; the reply appears under the review once approved.
  if (table === "reviews" && typeof b.reply === "string") {
    const reply = str(b.reply, 1000);
    const row = await update("reviews", id, { data: { reply: reply || undefined, replyAt: reply ? new Date().toISOString() : undefined } });
    await notifyStorefront();
    await audit("review.reply", id);
    return row ? json({ ok: true }) : bad("Not found", 404);
  }
  const status = str(b.status, 30);
  if (!allowed.includes(status)) return bad("Unknown status");
  const row = await update(table as Table, id, { status, data: table === "orders" ? { statusMode: "manual" } : undefined });
  if (!row) return bad("Not found", 404);
  if (table === "reviews") await notifyStorefront();
  await audit(`${table}.status`, id, status);
  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const { table, id } = await params;
  if (!EDITABLE[table as Table] || table === "orders") return bad("Not deletable");
  await remove(table as Table, id);
  await audit(`${table}.delete`, id);
  if (table === "reviews") await notifyStorefront();
  return json({ ok: true });
}
