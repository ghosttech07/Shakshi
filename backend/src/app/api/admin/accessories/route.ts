import { isAdmin } from "@/lib/server/studio";
import { upsert } from "@/lib/server/db";
import { audit } from "@/lib/server/content";
import { notifyStorefront } from "@/lib/server/notify";
import { shape } from "@/lib/server/shape";
import { bad, body, json } from "@/lib/server/http";
import type { Accessory, AccessoryKind } from "@shakshi/shared/products";

export const runtime = "nodejs";

const KINDS: AccessoryKind[] = ["pillow", "cover", "bedding"];
const TEMPLATE = { list: [{ id: "", kind: "pillow", name: "", price: 0, image: "", note: "", description: "", published: true }] };

/** Saves the whole pillows, covers and bedding range. Checkout prices come from this list. */
export async function PUT(req: Request) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const b = await body(req, 200_000);
  if (!b) return bad("Bad request");
  const items = shape(TEMPLATE, b).list;
  const seen = new Set<string>();
  const out: Accessory[] = [];
  for (const [i, a] of items.entries()) {
    const name = a.name.trim();
    if (!name) return bad(`Item ${i + 1} needs a name.`);
    const id = (a.id.trim() || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (seen.has(id)) return bad(`Two items share the address “${id}”. Give each a different one.`);
    seen.add(id);
    if (!KINDS.includes(a.kind as AccessoryKind)) return bad(`Choose a type for ${name}.`);
    if (!(a.price > 0)) return bad(`Set a price for ${name}.`);
    if (!a.image) return bad(`Add a photo for ${name}.`);
    out.push({ id, kind: a.kind as AccessoryKind, name, price: Math.round(a.price), image: a.image, note: a.note.trim(), description: a.description.trim() || undefined, published: a.published });
  }
  await upsert("content", "accessories", { list: out });
  await audit("accessories.save", "accessories", `${out.length} items`);
  await notifyStorefront();
  return json({ ok: true, list: out });
}
