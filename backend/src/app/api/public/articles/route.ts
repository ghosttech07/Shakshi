import { NextResponse } from "next/server";
import { getArticles } from "@/lib/server/catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sleep Library essays: built-in ones plus any published from the studio or Supabase. */
export async function GET() {
  return NextResponse.json({ articles: await getArticles() }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600" } });
}
