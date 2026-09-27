import { NextResponse } from "next/server";
import { getCatalog, getStock } from "@/lib/server/catalog";
import { getSite } from "@/lib/server/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the storefront needs on every page: live catalogue (published only), stock, and the published site config. */
export async function GET() {
  const [products, stock, site] = await Promise.all([getCatalog(), getStock(), getSite("published")]);
  return NextResponse.json({ products, stock, site }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
}
