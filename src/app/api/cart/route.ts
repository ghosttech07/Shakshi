import { upsert, get } from "@/lib/server/db";
import { bad, body, isEmail, isPhone, json, limited, num, str } from "@/lib/server/http";
import type { CartSnapshot } from "@/lib/records";

export const runtime = "nodejs";

/**
 * Saves the bag once a guest has shared contact details at checkout, so the team can follow up
 * if they don't finish (see /admin/carts for the email and WhatsApp templates).
 */
export async function POST(req: Request) {
  if (limited(req, "cart", 30)) return bad("Too many requests", 429);
  const b = await body(req, 24_000);
  if (!b) return bad("Bad request");
  const id = str(b.cartId, 60);
  const email = str(b.email, 120).toLowerCase();
  const phone = str(b.phone, 20);
  if (!/^[a-zA-Z0-9-]{8,60}$/.test(id) || !(isEmail(email) || isPhone(phone))) return bad("Bad request");

  const existing = await get<CartSnapshot>("abandoned_carts", id);
  if (existing?.status === "recovered") return json({ ok: true });

  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30).map((i: Record<string, unknown>) => ({
    name: str(i.name, 120),
    detail: str(i.detail, 200),
    qty: Math.max(1, Math.round(num(i.qty) || 1)),
    price: Math.max(0, Math.round(num(i.price) || 0)),
    image: str(i.image, 300),
  }));
  const data: CartSnapshot = {
    items,
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    step: Math.max(0, Math.min(4, Math.round(num(b.step) || 0))),
    name: str(b.name, 80),
    phone: phone || undefined,
    updatedAt: new Date().toISOString(),
  };
  await upsert("abandoned_carts", id, data, { email: isEmail(email) ? email : undefined, status: existing?.status ?? "open" });
  return json({ ok: true });
}
