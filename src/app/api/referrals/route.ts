import { get, list, upsert } from "@/lib/server/db";
import { bad, body, json, limited, str } from "@/lib/server/http";
import { REFERRAL_RE, type OrderData } from "@/lib/orders";

export const runtime = "nodejs";

/** Registers a member's referral code so friends' orders can be credited to them. */
export async function POST(req: Request) {
  if (limited(req, "referrals", 6)) return bad("Too many attempts", 429);
  const b = await body(req);
  if (!b) return bad("Bad request");
  const code = str(b.code, 20).toUpperCase();
  const name = str(b.name, 80);
  if (!REFERRAL_RE.test(code) || !name) return bad("Bad request");
  const existing = await get<{ name: string }>("referrals", code);
  if (existing && existing.data.name !== name) return bad("That code is taken", 409);
  if (!existing) await upsert("referrals", code, { name });
  return json({ code });
}

/** How many completed orders used this code (for the member's rewards). */
export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get("code") ?? "").toUpperCase();
  if (!REFERRAL_RE.test(code)) return bad("Bad request");
  const orders = await list<OrderData>("orders", { limit: 2000 });
  return json({ code, count: orders.filter((o) => o.data.promoCode === code).length });
}
