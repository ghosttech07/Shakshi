import { insert, list } from "@/lib/server/db";
import { orders } from "@/lib/server/studio-data";
import { bad, body, isEmail, json, limited, num, str } from "@/lib/server/http";
import { PRODUCTS } from "@shakshi/shared/products";
import type { ReviewData } from "@shakshi/shared/records";

export const runtime = "nodejs";

/**
 * Approved reviews (moderated in the studio's Reviews screen), newest first.
 * With ?product=, just that mattress; without it, the latest across the collection (?limit=, ?min= stars).
 * "Verified" means the reviewer's email has ordered that mattress. Emails are never returned.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const product = q.get("product") ?? "";
  const limit = Math.min(50, Math.max(1, Number(q.get("limit")) || 12));
  const min = Math.min(5, Math.max(1, Number(q.get("min")) || 1));
  const [rows, os] = await Promise.all([list<ReviewData>("reviews", { status: "approved", limit: 500 }), orders()]);
  const bought = new Set(os.filter((o) => !o.data.sample).flatMap((o) => o.data.items.filter((i) => i.kind === "mattress").map((i) => `${o.data.customer?.email?.toLowerCase()}|${i.ref}`)));
  const list_ = rows
    .filter((r) => (product ? r.data.product === product : r.data.rating >= min))
    .slice(0, product ? 200 : limit)
    .map((r) => ({ id: r.id, date: r.created_at.slice(0, 10), ...r.data, verified: bought.has(`${r.email}|${r.data.product}`) }));
  return json({ reviews: list_ }, 200);
}

/** New reviews wait for moderation before they appear. */
export async function POST(req: Request) {
  if (limited(req, "reviews", 5)) return bad("Too many attempts. Please wait a moment.", 429);
  const b = await body(req);
  if (!b) return bad("Bad request");
  const product = str(b.product, 30);
  const rating = Math.round(num(b.rating));
  const email = str(b.email, 120).toLowerCase();
  const data: ReviewData = {
    product,
    name: str(b.name, 40),
    rating,
    title: str(b.title, 100),
    body: str(b.body, 2000),
    position: (["side", "back", "stomach", "combination"].includes(b.position as string) ? b.position : "combination") as ReviewData["position"],
    body_type: (["petite", "average", "broad"].includes(b.body_type as string) ? b.body_type : "average") as ReviewData["body_type"],
    helpful: 0,
  };
  if (!PRODUCTS.some((p) => p.slug === product) || !(rating >= 1 && rating <= 5) || !data.name || data.title.length < 3 || data.body.length < 20 || !isEmail(email)) {
    return bad("Please add a title, at least a couple of sentences, and your email.");
  }
  const row = await insert("reviews", data, { status: "pending", email });
  return json({ id: row.id });
}
