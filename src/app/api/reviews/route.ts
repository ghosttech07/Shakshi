import { insert, list } from "@/lib/server/db";
import { bad, body, isEmail, json, limited, num, str } from "@/lib/server/http";
import { PRODUCTS } from "@/lib/products";
import type { ReviewData } from "@/lib/records";

export const runtime = "nodejs";

/** Approved reviews for a product (moderated in /admin/reviews). */
export async function GET(req: Request) {
  const product = new URL(req.url).searchParams.get("product") ?? "";
  const rows = await list<ReviewData>("reviews", { status: "approved", limit: 200 });
  return json({
    reviews: rows
      .filter((r) => r.data.product === product)
      .map((r) => ({ id: r.id, date: r.created_at.slice(0, 10), verified: false, ...r.data })),
  });
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
