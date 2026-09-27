import { NextResponse } from "next/server";
import { routing } from "@/lib/server/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Published page addresses (for the sitemap) and redirects (for the storefront's proxy). */
export async function GET() {
  return NextResponse.json(await routing(), { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
}
