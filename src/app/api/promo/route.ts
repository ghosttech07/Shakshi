import { checkPromo } from "@/lib/server/commerce";
import { bad, body, json, limited, num, str } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (limited(req, "promo", 15)) return bad("Too many attempts. Please wait a moment.", 429);
  const b = await body(req);
  if (!b) return bad("Bad request");
  const res = await checkPromo(str(b.code, 30), Math.max(0, num(b.subtotal) || 0), b.hasMattress === true);
  return res.ok ? json(res) : bad(res.message);
}
