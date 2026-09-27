import { isAdmin } from "@/lib/server/studio";
import { get, upsert } from "@/lib/server/db";
import { audit } from "@/lib/server/content";
import { NEW_PRODUCT } from "@/lib/server/catalog";
import { bad, body, json, str } from "@/lib/server/http";
import { PRODUCTS } from "@shakshi/shared/products";

export const runtime = "nodejs";

/** Creates a new mattress (hidden until published). */
export async function POST(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body(req);
  const name = str(b?.name, 80);
  const slug = str(b?.slug, 40).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (!name || !slug) return bad("Give the mattress a name and an address.");
  if (PRODUCTS.some((p) => p.slug === slug) || (await get("products", slug))) return bad("A mattress already uses that address.");
  await upsert("products", slug, { ...NEW_PRODUCT, slug, name, published: false });
  await audit("product.create", slug, name);
  return json({ slug });
}
