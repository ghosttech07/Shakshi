import { get } from "@/lib/server/db";
import { bad, json, limited } from "@/lib/server/http";
import { GIFT_RE } from "@shakshi/shared/orders";

export const runtime = "nodejs";

type Gift = { amount: number; balance: number; to?: string; from?: string; message?: string; design?: string };

/** What the recipient sees when they open their digital envelope. The code itself is the secret. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  if (limited(req, "gift", 30)) return bad("Too many requests", 429);
  const code = (await params).code.toUpperCase();
  if (!GIFT_RE.test(code)) return bad("Not found", 404);
  const g = await get<Gift>("gift_cards", code);
  if (!g) return bad("Not found", 404);
  const { amount, balance, to, from, message, design } = g.data;
  return json({ code, amount, balance, to, from, message, design });
}
