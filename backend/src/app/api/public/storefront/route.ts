import { NextResponse } from "next/server";
import { getAccessories, getCatalog, getStock } from "@/lib/server/catalog";
import { getSite } from "@/lib/server/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the storefront needs on every page: live catalogue (published only), pillows and covers, stock, and the published site config. */
export async function GET() {
  const [products, stock, site, accessories] = await Promise.all([getCatalog(), getStock(), getSite("published"), getAccessories()]);
  return NextResponse.json({ products, stock, site, accessories }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
}
