import { isAdmin } from "@/lib/server/studio";
import { get, remove, upsert } from "@/lib/server/db";
import { audit } from "@/lib/server/content";
import { notifyStorefront } from "@/lib/server/notify";
import { stockKey } from "@/lib/server/catalog";
import { shape } from "@/lib/server/shape";
import { bad, body, json } from "@/lib/server/http";
import { PRODUCTS, SIZES, type Material, type Position, type Product } from "@shakshi/shared/products";

export const runtime = "nodejs";
type Ctx = { params: Promise<{ slug: string }> };

const MATERIALS: Material[] = ["memory-foam", "latex", "pocket-springs", "cooling-gel", "wool"];
const POSITIONS: Position[] = ["side", "back", "stomach", "combination"];
const TEMPLATE = {
  name: "",
  tier: "",
  tagline: "",
  feeling: "",
  description: "",
  badge: "",
  firmness: 5,
  firmnessLabel: "",
  height: 0,
  basePrice: 0,
  images: [""],
  materials: [""],
  positions: [""],
  cooling: 3,
  motionIsolation: 3,
  edgeSupport: 3,
  highlights: [""],
  layers: [{ name: "", material: "", benefit: "", depth: 0 }],
  sink: 0,
  recovery: 0,
  published: true,
  category: "",
};
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

/** Saves a mattress: details, price per size, and units in stock per size (blank = made to order). */
export async function PUT(req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const slug = decodeURIComponent((await ctx.params).slug);
  const builtIn = PRODUCTS.some((p) => p.slug === slug);
  if (!builtIn && !(await get("products", slug))) return bad("Not found", 404);
  const b = await body<{ product: Partial<Product>; prices?: Record<string, unknown>; stock?: Record<string, unknown> }>(req, 200_000);
  if (!b?.product) return bad("Bad request");
  const p = shape(TEMPLATE, b.product);
  if (!p.name.trim()) return bad("The mattress needs a name.");
  if (!(p.basePrice > 0)) return bad("Set the Queen price.");
  const prices: Partial<Record<string, number>> = {};
  for (const s of SIZES) {
    const v = Number(b.prices?.[s.id]);
    if (Number.isFinite(v) && v > 0) prices[s.id] = Math.round(v);
  }
  const data: Partial<Product> = {
    ...p,
    badge: p.badge || undefined,
    category: p.category.toLowerCase().replace(/[^a-z0-9-]/g, "") || undefined,
    firmness: clamp(p.firmness, 1, 10),
    cooling: clamp(p.cooling, 1, 5),
    motionIsolation: clamp(p.motionIsolation, 1, 5),
    edgeSupport: clamp(p.edgeSupport, 1, 5),
    images: p.images.filter(Boolean),
    materials: p.materials.filter((m): m is Material => MATERIALS.includes(m as Material)),
    positions: p.positions.filter((m): m is Position => POSITIONS.includes(m as Position)),
    highlights: p.highlights.filter(Boolean),
    layers: p.layers.filter((l) => l.name),
    prices,
  };
  if (!data.images?.length) return bad("Add at least one image.");
  const existing = await get<Partial<Product>>("products", slug);
  await upsert("products", slug, { ...(existing?.data ?? {}), ...data, slug });

  for (const s of SIZES) {
    const raw = b.stock?.[s.id];
    const qty = raw === "" || raw === null || raw === undefined ? null : Math.max(0, Math.round(Number(raw)));
    await upsert("stock", stockKey(slug, s.id), { qty: Number.isFinite(qty as number) ? qty : null });
  }
  await audit("product.save", slug, data.published ? "visible" : "hidden");
  await notifyStorefront();
  return json({ ok: true });
}

/** Built-in mattresses are marked removed (the seed stays in code); ones created in the studio are deleted. */
export async function DELETE(_req: Request, ctx: Ctx) {
  if (!(await isAdmin())) return bad("Unauthorised", 401);
  const slug = decodeURIComponent((await ctx.params).slug);
  if (PRODUCTS.some((p) => p.slug === slug)) {
    const existing = await get<Partial<Product>>("products", slug);
    await upsert("products", slug, { ...(existing?.data ?? {}), deleted: true });
  } else await remove("products", slug);
  await audit("product.delete", slug);
  await notifyStorefront();
  return json({ ok: true });
}
