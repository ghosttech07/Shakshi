import { NextResponse } from "next/server";
import { publishedPage } from "@/lib/server/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A published page by slug ("" for home). 404 when there's no such page. */
export async function GET(req: Request) {
  const slug = (new URL(req.url).searchParams.get("slug") ?? "").replace(/^\/+|\/+$/g, "");
  const page = await publishedPage(slug);
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ page }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
}
