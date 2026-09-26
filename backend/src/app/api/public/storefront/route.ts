import { NextResponse } from "next/server";
import { getCatalog, getStock } from "@/lib/server/catalog";
import { getSettings } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the storefront needs to render: live catalogue (published only), stock and store settings. */
export async function GET() {
  const [products, stock, settings] = await Promise.all([getCatalog(), getStock(), getSettings()]);
  return NextResponse.json({ products, stock, settings }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
}
