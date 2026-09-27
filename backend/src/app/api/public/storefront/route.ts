import { NextResponse } from "next/server";
import { getCatalog, getStock } from "@/lib/server/catalog";
import { getDoc, getSite } from "@/lib/server/content";
import { DEFAULT_QUIZ, type QuizConfig } from "@shakshi/shared/quiz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the storefront needs on every page: live catalogue (published only), stock, and the published site config and quiz. */
export async function GET() {
  const [products, stock, site, quiz] = await Promise.all([getCatalog(), getStock(), getSite("published"), getDoc<QuizConfig>("quiz", DEFAULT_QUIZ)]);
  return NextResponse.json({ products, stock, site, quiz: quiz.published ?? DEFAULT_QUIZ }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
}
